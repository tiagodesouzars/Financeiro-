import React, { useState } from 'react';
import { Download, Share2, Smartphone, X, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  // If already running inside standalone app, or dismissed by user
  if (isInstalled || dismissed) {
    return null;
  }

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-3 mx-4 my-3 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Instalar App no Celular
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-semibold">
                Samsung S25 FE
              </span>
            </p>
            <p className="text-[11px] text-slate-300 truncate">
              {isInstallable ? 'Instale com ícone oficial na sua tela' : 'Fixe com ícone oficial na tela inicial'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable ? (
            <button
              id="install-pwa-banner-btn"
              onClick={install}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-lg text-white font-semibold text-xs transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar
            </button>
          ) : (
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-lg text-white font-semibold text-xs transition shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Como Instalar
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            aria-label="Fechar aviso"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Step-by-Step Installation Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Instalar no Samsung Galaxy S25 FE
                  </h3>
                  <p className="text-[11px] text-slate-400">Instalação direta com ícone oficial</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Link Copy Button to Avoid 404 */}
            <div className="mb-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-300 font-semibold block mb-1.5">
                1. Link direto do seu aplicativo:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.origin}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-400 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Cole no <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong> do seu celular.
              </p>
            </div>

            {/* Android / Samsung Guide */}
            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5 mb-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 inline-flex items-center justify-center text-[11px]">
                    2
                  </span>
                  No Google Chrome (Android / Samsung Galaxy):
                </h4>
                <ol className="space-y-1.5 list-decimal pl-5 text-[11px] text-slate-300">
                  <li>
                    Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome.
                  </li>
                  <li>
                    Procure e selecione <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                  </li>
                  <li>
                    <strong className="text-emerald-400">💡 Dica Samsung One UI:</strong> Se abrir a janela com <em>&quot;Instalar e criar atalho&quot;</em> e a opção de cima disser <em>&quot;Não é possível instalar o app&quot;</em>, toque diretamente em <strong>&quot;Criar atalho&quot;</strong> logo abaixo!
                  </li>
                  <li>
                    Toque em <strong>Adicionar</strong>: O aplicativo será criado com o <strong>ícone oficial de Finanças</strong> (com fundo escuro elegante) na tela do seu Samsung e abrirá em <strong>tela cheia</strong> como app nativo!
                  </li>
                </ol>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5 mb-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 inline-flex items-center justify-center text-[11px]">
                    ou
                  </span>
                  No Samsung Internet (Navegador Galaxy):
                </h4>
                <ol className="space-y-1.5 list-decimal pl-5 text-[11px] text-slate-300">
                  <li>
                    Observe a barra de endereço: toque no <strong>ícone de Download (seta para baixo)</strong> que aparece no lado direito, ou no menu de <strong>3 traços (☰)</strong>.
                  </li>
                  <li>
                    Toque em <strong>"Instalar aplicativo web"</strong> ou <strong>"Adicionar página a &gt; Tela inicial"</strong>.
                  </li>
                </ol>
              </div>

              {isIOS && (
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                  <h4 className="font-bold text-slate-100 flex items-center gap-1.5 mb-1.5 text-xs">
                    No iPhone / iPad (Safari):
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima) e escolha <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
