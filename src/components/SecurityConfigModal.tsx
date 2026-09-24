import React, { useState, useEffect } from 'react';
import {
  Shield,
  Fingerprint,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  RefreshCw,
  Play,
  Check,
  AlertTriangle,
  Lock,
  Layers,
  Zap,
} from 'lucide-react';
import {
  registerDeviceBiometrics,
  authenticateWithBiometrics,
  checkBiometricsAvailability,
  BiometricAvailability,
} from '../services/biometrics';
import {
  BiometricSecurityConfig,
  PaymentCard,
  Transaction,
  FixedBill,
  UserFinancialProfile,
} from '../types';
import { runSecurityAudit, SecurityAuditReport } from '../utils/security';

interface SecurityConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityConfig?: BiometricSecurityConfig;
  onSaveConfig: (config: BiometricSecurityConfig) => void;
  cards?: PaymentCard[];
  transactions?: Transaction[];
  bills?: FixedBill[];
  profile?: UserFinancialProfile;
}

export const SecurityConfigModal: React.FC<SecurityConfigModalProps> = ({
  isOpen,
  onClose,
  securityConfig,
  onSaveConfig,
  cards = [],
  transactions = [],
  bills = [],
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'audit'>('config');

  // Config State
  const [enabled, setEnabled] = useState(securityConfig?.enabled || false);
  const [credentialId, setCredentialId] = useState<string | undefined>(
    securityConfig?.credentialId
  );
  const [pin, setPin] = useState(securityConfig?.pinFallback || '');
  const [requireOnResume, setRequireOnResume] = useState(
    securityConfig?.requireOnAppResume ?? true
  );

  const [availability, setAvailability] = useState<BiometricAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Security Audit State
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEnabled(securityConfig?.enabled || false);
      setCredentialId(securityConfig?.credentialId);
      setPin(securityConfig?.pinFallback || '');
      setRequireOnResume(securityConfig?.requireOnAppResume ?? true);
      setFeedback(null);

      checkBiometricsAvailability().then(setAvailability);

      // Auto-run initial security test
      handleRunSecurityAudit();
    }
  }, [isOpen, securityConfig]);

  if (!isOpen) return null;

  const handleRunSecurityAudit = async () => {
    setIsRunningAudit(true);
    try {
      // Simulate minor async verification
      await new Promise((r) => setTimeout(r, 400));
      const report = await runSecurityAudit(
        cards,
        transactions,
        bills,
        profile,
        securityConfig
      );
      setAuditReport(report);
    } catch {
      // Silent error fallback
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleRegisterBiometrics = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const userName = profile?.name || 'Titular';
      const result = await registerDeviceBiometrics(userName);
      if (result.success && result.credentialId) {
        setCredentialId(result.credentialId);
        setEnabled(true);
        setFeedback({
          type: 'success',
          text: 'Biometria vinculada com sucesso a este dispositivo!',
        });
      } else {
        setFeedback({
          type: 'error',
          text: result.error || 'Não foi possível cadastrar a biometria neste navegador.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro ao tentar acionar o leitor biométrico.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestBiometrics = async () => {
    if (!credentialId) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const result = await authenticateWithBiometrics(credentialId);
      if (result.success) {
        setFeedback({
          type: 'success',
          text: 'Autenticação biométrica confirmada e funcionando perfeitamente!',
        });
      } else {
        setFeedback({
          type: 'error',
          text: result.error || 'Falha na verificação biométrica.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro ao testar biometria.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (enabled && !credentialId && (!pin || pin.length < 4)) {
      setFeedback({
        type: 'error',
        text: 'Cadastre a biometria ou defina um código PIN de pelo menos 4 dígitos.',
      });
      return;
    }

    const updated: BiometricSecurityConfig = {
      enabled,
      credentialId,
      pinFallback: pin ? pin : undefined,
      requireOnAppResume: requireOnResume,
    };

    onSaveConfig(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Segurança, Biometria & Diagnósticos
              </h3>
              <p className="text-[11px] text-slate-400">
                Proteção do aparelho, PIN e testes de isolamento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Biometria & PIN</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('audit');
              if (!auditReport) handleRunSecurityAudit();
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Testes de Segurança</span>
            {auditReport && (
              <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full font-mono">
                {auditReport.passedTests}/{auditReport.totalTests}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'config' ? (
          <>
            {/* Device Support Status Pill */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Suporte no Dispositivo:</span>
              </div>
              <span
                className={`font-semibold ${
                  availability?.supported ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {availability?.supported ? 'Disponível (Touch/Face ID)' : 'Apenas PIN (WebAuthn restrito)'}
              </span>
            </div>

            {/* Toggle Enable Biometric Lock */}
            <div className="p-3 bg-slate-850 rounded-xl border border-slate-750 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Fingerprint className="w-5 h-5 text-teal-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Exigir Autenticação ao Abrir</p>
                  <p className="text-[10px] text-slate-400">
                    Bloqueia o app caso fique inativo ou minimizado
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {enabled && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                {/* Register Biometric Key */}
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Vincular Biometria do Aparelho (Galaxy/Android/iOS)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRegisterBiometrics}
                      disabled={isLoading}
                      className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                    >
                      <Fingerprint className="w-4 h-4" />
                      {credentialId ? 'Recadastrar Biometria' : 'Cadastrar Digital / Face'}
                    </button>

                    {credentialId && (
                      <button
                        type="button"
                        onClick={handleTestBiometrics}
                        disabled={isLoading}
                        className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1"
                        title="Testar sensor biométrico agora"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Testar
                      </button>
                    )}
                  </div>
                  {credentialId && (
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Biometria vinculada com sucesso a este dispositivo.
                    </p>
                  )}
                </div>

                {/* PIN Fallback with Brute-Force Rate Limiting Notice */}
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      PIN de Segurança Reserva (4 a 6 dígitos)
                    </label>
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 1234"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Protegido por rate-limiting: bloqueio automático de 30s após 5 erros consecutivos.
                  </p>
                </div>

                {/* Require on App Resume */}
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-750 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-300">
                      Bloquear ao alternar ou minimizar o app
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Pede autenticação ao retornar à tela
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireOnResume}
                    onChange={(e) => setRequireOnResume(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95"
              >
                Salvar Segurança
              </button>
            </div>
          </>
        ) : (
          /* TAB 2: TESTES DE SEGURANÇA E DIAGNÓSTICO */
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Header banner & trigger */}
            <div className="p-3.5 bg-slate-850 rounded-2xl border border-slate-750 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Auditoria de Isolamento & Segurança
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Testa segregação de cartões, XSS, rate limiting e integridade
                </span>
              </div>

              <button
                type="button"
                onClick={handleRunSecurityAudit}
                disabled={isRunningAudit}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
                <span>{isRunningAudit ? 'Testando...' : 'Reexecutar'}</span>
              </button>
            </div>

            {/* Overall Score Badge */}
            {auditReport && (
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Nota Geral</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    {auditReport.score}/100
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                  <span
                    className={`text-xs font-bold uppercase ${
                      auditReport.overallStatus === 'secure'
                        ? 'text-emerald-400'
                        : auditReport.overallStatus === 'warning'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {auditReport.overallStatus === 'secure' ? '100% Seguro' : 'Atenção'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Testes</span>
                  <span className="text-xs font-bold text-slate-200">
                    {auditReport.passedTests} de {auditReport.totalTests} ok
                  </span>
                </div>
              </div>
            )}

            {/* Test Results List */}
            {auditReport && (
              <div className="space-y-2">
                {auditReport.results.map((test) => {
                  const isPassed = test.status === 'passed';
                  const isWarning = test.status === 'warning';

                  return (
                    <div
                      key={test.id}
                      className="p-3 bg-slate-800/60 rounded-xl border border-slate-750 flex items-start gap-2.5"
                    >
                      <div className="mt-0.5 shrink-0">
                        {isPassed ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isWarning ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-200 truncate">
                            {test.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {test.executionTimeMs}ms
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 mt-0.5">{test.message}</p>

                        {test.details && (
                          <p className="text-[10px] text-slate-400 mt-1 font-mono bg-slate-900/60 px-2 py-1 rounded-md border border-slate-800">
                            {test.details}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
