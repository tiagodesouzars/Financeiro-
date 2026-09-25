import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Moon,
  Sun,
  Share2,
  HelpCircle,
  FileCode,
  PackageCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidAPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme?: (theme: 'amoled-dark' | 'system-light') => void;
  currentTheme?: string;
}

export const AndroidAPKModal: React.FC<AndroidAPKModalProps> = ({
  isOpen,
  onClose,
  onSelectTheme,
  currentTheme = 'amoled-dark',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'apk' | 'explain'>('install');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentUrl)}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu App de Finanças Pessoais',
          text: 'Instale o aplicativo nativo de finanças no seu Android / Galaxy S25 FE:',
          url: currentUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Aplicativo Nativo Android (.APK)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Samsung & Android
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instalação nativa direta, pacote APK e esclarecimentos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'install'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Instalar no Celular</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Arquivo .APK</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explain')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'explain'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Entenda PWA vs APK</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: INSTALAR NO CELULAR (WebAPK) */}
          {activeTab === 'install' && (
            <div className="space-y-3.5">
              {/* Status do App */}
              {isInstalled ? (
                <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <h4 className="font-bold text-white text-sm">Aplicativo Instalado no Aparelho!</h4>
                  <p className="text-slate-300 text-[11px] mt-1">
                    O aplicativo já está instalado no seu Android em modo tela cheia nativo, com ícone próprio e suporte offline.
                  </p>
                </div>
              ) : isInstallable ? (
                <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Instalar Aplicativo com 1 Toque</h4>
                    <p className="text-slate-300 text-[11px] mt-1">
                      O Android detectou o aplicativo. Toque abaixo para instalar direto no seu aparelho:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar Aplicativo no Celular</span>
                  </button>
                </div>
              ) : null}

              {/* Guia Ilustrado para Samsung Galaxy */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Como instalar no Samsung Galaxy S25 FE (ou qualquer Android):
                </h4>

                <div className="space-y-2.5 text-[11px]">
                  <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-100">Abra o link no Chrome ou Samsung Internet:</strong>
                      <p className="text-slate-400 mt-0.5">
                        Acesse este link no navegador do seu smartphone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-100">Abra o menu do navegador:</strong>
                      <p className="text-slate-400 mt-0.5">
                        No <strong>Chrome</strong>: toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito.<br/>
                        No <strong>Samsung Internet</strong>: toque no menu <strong>(☰)</strong> no canto inferior direito.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-100">Toque em &quot;Instalar aplicativo&quot;:</strong>
                      <p className="text-slate-400 mt-0.5">
                        O sistema Android gerará o <strong>WebAPK nativo</strong> e colocará o ícone oficial na gaveta de apps. Ao abrir, ele roda <strong>sem barra de navegação, sem abas de navegador e em tela cheia total</strong>!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Copiar e Compartilhar Link */}
                <div className="pt-2 border-t border-slate-700/60 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 active:scale-[0.98] text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition text-[11px]"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link para o Celular'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition text-[11px]"
                    title="Compartilhar link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BAIXAR ARQUIVO .APK / PWABUILDER */}
          {activeTab === 'apk' && (
            <div className="space-y-3.5">
              {/* Alerta de Esclarecimento sobre o PWABuilder */}
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Por que o PWABuilder acusou &quot;Missing Name / Create a manifest&quot;?</span>
                </div>
                <p className="text-amber-100/90 leading-relaxed">
                  O <strong>PWABuilder</strong> é um robô de testes externo. Como os links de desenvolvimento do Google AI Studio possuem firewall de segurança contra robôs automatizados (<code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">__cookie_check.html</code>), o robô do PWABuilder não consegue ler o código remotamente.
                </p>
                <p className="text-emerald-300 font-semibold">
                  👉 <strong>Boas notícias:</strong> Você <u>NÃO</u> precisa do PWABuilder para ter o app nativo no seu Samsung Galaxy S25 FE! O Android instala o app diretamente com 1 toque pelo navegador.
                </p>
              </div>

              {/* Método Recomendado: Instalação Nativa Direta */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Passo a Passo Oficial para Instalar no Celular:
                </h4>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-100">Abra o link no Chrome do seu celular:</strong>
                      <p className="text-slate-400 mt-0.5 break-all">
                        {currentUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-100">Toque nos 3 pontinhos (⋮) do Chrome:</strong>
                      <p className="text-slate-400 mt-0.5">
                        Fica no topo superior direito da tela do seu Samsung Galaxy.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <div>
                      <strong className="text-emerald-400">Toque em &quot;Instalar aplicativo&quot;:</strong>
                      <p className="text-slate-300 mt-0.5">
                        O Google Play Services do Android gerará o pacote nativo (WebAPK) e criará o ícone na sua gaveta de aplicativos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link para Enviar ao Celular'}</span>
                  </button>
                </div>
              </div>

              {/* Download direto do arquivo manifest.json */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-xs">Arquivo manifest.json Oficial</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const manifestData = {
                        id: "financas-pessoais-app",
                        name: "Finanças Pessoais",
                        short_name: "Finanças",
                        description: "Controle financeiro pessoal completo, despesas, receitas, contas fixas, metas e investimentos.",
                        start_url: "/",
                        scope: "/",
                        lang: "pt-BR",
                        display: "standalone",
                        background_color: "#090d16",
                        theme_color: "#090d16",
                        orientation: "portrait-primary",
                        categories: ["finance", "productivity"],
                        icons: [
                          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
                        ]
                      };
                      const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'manifest.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-lg text-[10px] flex items-center gap-1 border border-slate-700 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Baixar manifest.json</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  O manifesto oficial deste app já contém nome, ícones, cores e configurações de tela cheia standalone para Android.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ESCLARECIMENTO - PWA VS APK NATIVO */}
          {activeTab === 'explain' && (
            <div className="space-y-3.5 text-slate-300 text-[11px] leading-relaxed">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Por que este app é nativo e como funciona?</span>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      1. O que é o WebAPK no Android?
                    </h5>
                    <p className="text-slate-300 text-[10px]">
                      Quando você toca em <strong>&quot;Instalar aplicativo&quot;</strong>, o Android não cria um mero atalho de navegador. O <strong>Google Play Services</strong> compila um pacote APK nativo real no seu aparelho e instala em <code>/data/app</code>. Ele recebe seu próprio ícone na gaveta de aplicativos e abre em <strong>tela cheia nativa sem navegador</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      2. Por que pareceu uma versão de navegador antes?
                    </h5>
                    <p className="text-slate-300 text-[10px]">
                      Se o link for aberto direto no navegador sem tocar em &quot;Instalar aplicativo&quot;, ele roda dentro das abas do Chrome. Após a instalação pelo menu do navegador (ou pelo botão Instalar), o app vira um executável independente que abre sem abas e sem barra de URL.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      3. Recursos Nativos 100% integrados
                    </h5>
                    <p className="text-slate-300 text-[10px]">
                      • <strong>Biometria nativa:</strong> leitor de digital e reconhecimento facial do Galaxy S25 FE.<br/>
                      • <strong>Banco de dados interno:</strong> IndexedDB rápido e offline-first.<br/>
                      • <strong>Taxa de 120Hz:</strong> animações suaves One UI da Samsung.
                    </p>
                  </div>
                </div>

                {onSelectTheme && (
                  <div className="pt-2 border-t border-slate-700/60">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1.5">
                      Calibração de Tela do Galaxy S25 FE:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectTheme('amoled-dark')}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition ${
                          currentTheme === 'amoled-dark'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>AMOLED Dark (#000)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTheme('system-light')}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition ${
                          currentTheme === 'system-light'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Modo Claro</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AndroidAPKModal;
