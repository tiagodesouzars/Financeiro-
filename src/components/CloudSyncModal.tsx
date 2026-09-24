import React, { useState } from 'react';
import {
  Cloud,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  LogIn,
  LogOut,
  ShieldCheck,
  Trash2,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudUser: User | null;
  isSyncing: boolean;
  lastSyncTime: string | null;
  onSaveToCloud: () => Promise<void>;
  onRestoreFromCloud: () => Promise<void>;
  onLoginGoogle: () => Promise<void>;
  onLogout: () => Promise<void>;
  onClearAllData: () => void;
  onPurgeUnrealData?: () => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  cloudUser,
  isSyncing,
  lastSyncTime,
  onSaveToCloud,
  onRestoreFromCloud,
  onLoginGoogle,
  onLogout,
  onClearAllData,
  onPurgeUnrealData,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen) return null;

  const handlePurgeUnreal = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      if (onPurgeUnrealData) {
        await onPurgeUnrealData();
      }
      setFeedback({
        type: 'success',
        message: 'Todos os dados irreais, de demonstração ou fictícios foram apagados com sucesso!',
      });
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: 'Erro ao remover dados fictícios.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualSave = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await onSaveToCloud();
      setFeedback({
        type: 'success',
        message: 'Sincronização com o banco em nuvem atualizada com sucesso!',
      });
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e?.message || 'Erro ao sincronizar dados na nuvem. Verifique sua conexão.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualRestore = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await onRestoreFromCloud();
      setFeedback({
        type: 'success',
        message: 'Dados baixados e restaurados da nuvem com sucesso!',
      });
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e?.message || 'Nenhum dado encontrado na nuvem para restaurar.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogin = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await onLoginGoogle();
      setFeedback({
        type: 'success',
        message: 'Conta Google conectada com sucesso!',
      });
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: 'Falha no login com Google. Tente novamente.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmClear = () => {
    onClearAllData();
    setShowClearConfirm(false);
    setFeedback({
      type: 'success',
      message: 'Todos os registros foram zerados com sucesso.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/90 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                Salvar no Banco em Nuvem
              </h2>
              <p className="text-[11px] text-slate-400">
                Sincronização segura Firestore & Google Auth
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in slide-in-from-top-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <p className="leading-relaxed font-medium">{feedback.message}</p>
          </div>
        )}

        {/* Content Section */}
        <div className="mt-4 space-y-4">
          {cloudUser ? (
            /* CONNECTED USER CARD */
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {cloudUser.photoURL ? (
                        <img
                          src={cloudUser.photoURL}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        cloudUser.email?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">
                        {cloudUser.displayName || 'Usuário Conectado'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{cloudUser.email}</p>
                    </div>
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Conectado
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                  <span>Última sincronização:</span>
                  <span className="text-slate-200 font-semibold">
                    {lastSyncTime || 'Sincronizado agora'}
                  </span>
                </div>
              </div>

              {/* Auto-save notification badge */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Salvamento 100% Automático Ativo
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Não é necessário exportar ou salvar manualmente. Cada gasto, receita, fatura paga,
                  meta ou investimento criado ou alterado é gravado diretamente na nuvem em tempo real.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handlePurgeUnreal}
                  disabled={actionLoading || isSyncing}
                  className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] border border-amber-500/30 text-amber-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Apagar Todo e Qualquer Dado Irreal
                </button>

                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={actionLoading || isSyncing}
                  className="w-full py-2.5 px-3 bg-slate-850 hover:bg-slate-800 active:scale-[0.98] border border-slate-700 text-slate-300 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-blue-400 ${
                      actionLoading || isSyncing ? 'animate-spin' : ''
                    }`}
                  />
                  {actionLoading || isSyncing ? 'Sincronizando...' : 'Verificar Sincronização Agora'}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Banco seguro Firestore
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-slate-400 hover:text-red-400 font-medium inline-flex items-center gap-1 transition"
                >
                  <LogOut className="w-3 h-3" /> Desconectar conta
                </button>
              </div>
            </div>
          ) : (
            /* NOT CONNECTED STATE */
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-2.5 border border-blue-500/20">
                  <Cloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  Seus dados ainda estão salvos apenas neste aparelho
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Conecte sua conta Google com 1 toque para manter suas finanças salvas na nuvem com
                  segurança e nunca perder seus lançamentos ao trocar de aparelho ou limpar o
                  navegador.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={actionLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2.5 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {actionLoading ? 'Conectando...' : 'Conectar com Conta Google'}
              </button>
            </div>
          )}

          {/* Reset / Zero Out Data Option */}
          <div className="pt-3 border-t border-slate-800">
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-2 px-3 bg-slate-850 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-medium rounded-xl border border-slate-800 hover:border-red-500/30 flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Zerar Todos os Dados (Local e Nuvem)
              </button>
            ) : (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2 text-center animate-in fade-in">
                <p className="text-xs font-bold text-red-200">
                  Deseja realmente zerar todos os registros?
                </p>
                <p className="text-[11px] text-slate-300">
                  Isso apagará todas as despesas, receitas, contas fixas, metas e investimentos salvos tanto localmente quanto na nuvem.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClear}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow"
                  >
                    Sim, Zerar Tudo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Close */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
