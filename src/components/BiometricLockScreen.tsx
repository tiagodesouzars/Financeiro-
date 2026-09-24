import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import {
  authenticateWithBiometrics,
  checkBiometricsAvailability,
  BiometricAvailability,
} from '../services/biometrics';
import { BiometricSecurityConfig } from '../types';

interface BiometricLockScreenProps {
  config: BiometricSecurityConfig;
  userName?: string;
  onUnlocked: () => void;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({
  config,
  userName = 'Usuário',
  onUnlocked,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [availability, setAvailability] = useState<BiometricAvailability | null>(null);
  const [showPinInput, setShowPinInput] = useState(!config.credentialId && !!config.pinFallback);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutSeconds > 0) {
      timer = setTimeout(() => {
        setLockoutSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [lockoutSeconds]);

  useEffect(() => {
    checkBiometricsAvailability().then((avail) => {
      setAvailability(avail);
      // Auto-trigger biometric prompt if credentials configured
      if (avail.supported) {
        handleBiometricPrompt(false);
      }
    });
  }, []);

  const handleBiometricPrompt = async (isManualClick: boolean = true) => {
    if (lockoutSeconds > 0) {
      setErrorMsg(`Aparelho bloqueado por excesso de tentativas. Aguarde ${lockoutSeconds}s.`);
      return;
    }
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      const result = await authenticateWithBiometrics(config.credentialId);
      if (result.success) {
        setFailedAttempts(0);
        onUnlocked();
      } else {
        if (isManualClick) {
          setErrorMsg(result.error || 'Autenticação biométrica falhou.');
        }
      }
    } catch {
      if (isManualClick) {
        setErrorMsg('Erro ao tentar acionar o leitor biométrico.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!config.pinFallback) return;

    if (pinInput === config.pinFallback) {
      setFailedAttempts(0);
      onUnlocked();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPinInput('');
      if (newAttempts >= 5) {
        setLockoutSeconds(30);
        setErrorMsg('Muitas tentativas incorretas (5x). Aparelho bloqueado por 30 segundos por segurança.');
      } else {
        setErrorMsg(`Código PIN incorreto (${newAttempts}/5 tentativas antes do bloqueio).`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 sm:p-8 animate-in fade-in duration-200 select-none">
      {/* Top Brand / Status */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold tracking-wider uppercase">Finanças Pessoais</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>Protegido</span>
        </div>
      </div>

      {/* Center Biometric Prompt Box */}
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        <div className="relative">
          {/* Pulsing ring */}
          <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-lg animate-pulse" />
          
          <button
            type="button"
            onClick={() => handleBiometricPrompt(true)}
            disabled={isVerifying}
            className="relative w-24 h-24 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border-2 border-emerald-500/40 hover:border-emerald-400 text-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/10 active:scale-95 transition-all group cursor-pointer"
            title="Tocar para desbloquear com biometria"
          >
            <Fingerprint className="w-12 h-12 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Olá, {userName}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
            Toque na digital acima para autenticar com a biometria ou reconhecimento facial do seu aparelho.
          </p>
        </div>

        {errorMsg && (
          <div className="w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN Fallback Form */}
        {config.pinFallback && (
          <div className="w-full pt-2">
            {!showPinInput ? (
              <button
                type="button"
                onClick={() => setShowPinInput(true)}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Usar senha PIN de backup</span>
              </button>
            ) : (
              <form onSubmit={handlePinSubmit} className="space-y-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <label className="text-[11px] font-semibold text-slate-400 block text-left">
                  Digite seu PIN de 4 a 6 dígitos:
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-white focus:outline-none focus:border-emerald-500 font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Entrar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-400"
                >
                  Voltar para biometria
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full max-w-sm text-center pb-2">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Biometria do Dispositivo (WebAuthn / Android / iOS)</span>
        </div>
      </div>
    </div>
  );
};
