import Dexie, { Table } from 'dexie';
import {
  saveTransactionToCloud,
  deleteTransactionFromCloud,
  saveFixedBillToCloud,
  deleteFixedBillFromCloud,
  saveSavingsGoalToCloud,
  saveInvestmentToCloud,
  deleteInvestmentFromCloud,
  savePaymentCardToCloud,
  deletePaymentCardFromCloud,
} from './cloudStorage';
import {
  Transaction,
  FixedBill,
  SavingsGoal,
  InvestmentAsset,
  PaymentCard,
} from '../types';

export interface PendingOfflineOperation {
  id?: number;
  entity: 'transaction' | 'fixedBill' | 'savingsGoal' | 'investment' | 'paymentCard';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

export class FinancasOfflineDatabase extends Dexie {
  pendingOperations!: Table<PendingOfflineOperation, number>;

  constructor() {
    super('FinancasOfflineDB');
    this.version(1).stores({
      pendingOperations: '++id, entity, action, timestamp',
    });
  }
}

export const offlineDb = new FinancasOfflineDatabase();

/**
 * Enqueues a write/delete operation when offline or for guaranteed sync
 */
export async function queueOfflineOperation(
  entity: PendingOfflineOperation['entity'],
  action: PendingOfflineOperation['action'],
  payload: any
): Promise<void> {
  try {
    await offlineDb.pendingOperations.add({
      entity,
      action,
      payload,
      timestamp: Date.now(),
    });
    console.log(`[OfflineSync] Queued ${action} on ${entity}`);
  } catch (err) {
    console.warn('[OfflineSync] Could not enqueue operation:', err);
  }
}

/**
 * Drains the queued operations and synchronizes them with Firebase Firestore
 */
export async function drainOfflineQueue(onProgress?: (pendingCount: number) => void): Promise<{
  synced: number;
  failed: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const items = await offlineDb.pendingOperations.orderBy('timestamp').toArray();
  if (items.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      let success = false;

      switch (item.entity) {
        case 'transaction':
          if (item.action === 'delete') {
            success = await deleteTransactionFromCloud(item.payload.id, item.payload);
          } else {
            success = await saveTransactionToCloud(item.payload as Transaction);
          }
          break;

        case 'fixedBill':
          if (item.action === 'delete') {
            success = await deleteFixedBillFromCloud(item.payload.id);
          } else {
            success = await saveFixedBillToCloud(item.payload as FixedBill);
          }
          break;

        case 'savingsGoal':
          success = await saveSavingsGoalToCloud(item.payload as SavingsGoal);
          break;

        case 'investment':
          if (item.action === 'delete') {
            success = await deleteInvestmentFromCloud(item.payload.id);
          } else {
            success = await saveInvestmentToCloud(item.payload as InvestmentAsset);
          }
          break;

        case 'paymentCard':
          if (item.action === 'delete') {
            const res = await deletePaymentCardFromCloud(item.payload.id);
            success = res.success;
          } else {
            const res = await savePaymentCardToCloud(item.payload as PaymentCard);
            success = res.success;
          }
          break;
      }

      if (success && item.id) {
        await offlineDb.pendingOperations.delete(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }

    if (onProgress) {
      const remaining = await offlineDb.pendingOperations.count();
      onProgress(remaining);
    }
  }

  return { synced, failed };
}

/**
 * Initialize automatic sync listener for online reconnection
 */
export function initOfflineSyncListener(onSyncComplete?: (count: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = async () => {
    console.log('[OfflineSync] Dispositivo online detectado! Sincronizando fila pendente...');
    const result = await drainOfflineQueue();
    if (result.synced > 0 && onSyncComplete) {
      onSyncComplete(result.synced);
    }
  };

  window.addEventListener('online', handleOnline);

  // Initial attempt if already online
  if (navigator.onLine) {
    drainOfflineQueue().catch(() => {});
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
