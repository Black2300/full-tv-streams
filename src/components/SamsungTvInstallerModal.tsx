"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tv,
  Download,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  MonitorPlay,
  Layers,
} from "lucide-react";

interface SamsungTvInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SamsungTvInstallerModal: React.FC<SamsungTvInstallerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        "Para instalar na sua Smart TV Samsung, abra o navegador da TV, acesse este site e clique no menu do navegador (três pontos) -> 'Adicionar à Tela Inicial'."
      );
    }
  };

  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://full-tv-streams.vercel.app";

  const copyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0d1017] border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">Instalar na Smart TV Samsung</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-black">
                  Tizen OS
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Execute o Full TV Streams diretamente como aplicativo nativo na sua TV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Método 1: Instalação Direta no Navegador da TV (Recomendado) */}
        <div className="bg-surface-light border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Método Direto na TV Samsung (Sem Computador)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Recomendado
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-gray-300">
            <div className="flex items-start gap-3 bg-surface p-3 rounded-xl border border-white/5">
              <span className="text-emerald-400 font-bold">•</span>
              <div>
                <strong className="text-white block mb-0.5">1. Abra o Navegador na TV Samsung</strong>
                <span>Pressione o botão Home no controle remoto e abra o aplicativo <strong>Navegador da Web</strong> (Internet).</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-surface p-3 rounded-xl border border-white/5">
              <span className="text-emerald-400 font-bold">•</span>
              <div>
                <strong className="text-white block mb-0.5">2. Acesse o seu site</strong>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono text-emerald-400 bg-black/50 px-2 py-1 rounded border border-white/10 break-all">
                    {currentUrl}
                  </code>
                  <button
                    onClick={copyUrl}
                    className="text-xs font-semibold px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors whitespace-nowrap"
                  >
                    {copiedUrl ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-surface p-3 rounded-xl border border-white/5">
              <span className="text-emerald-400 font-bold">•</span>
              <div>
                <strong className="text-white block mb-0.5">3. Clique em &ldquo;Adicionar à Tela Inicial&rdquo;</strong>
                <span>
                  No canto superior direito do navegador da TV, clique no menu de opções (ícone de 3 pontos <code>⋮</code> ou estrela de favoritos) e selecione <strong>&ldquo;Adicionar à Tela Inicial&rdquo;</strong> ou <strong>&ldquo;Instalar Aplicativo&rdquo;</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Pronto!</strong> O ícone do <strong>Full TV Streams</strong> ficará salvo na barra principal da sua Smart TV Samsung ao lado de Netflix e YouTube, abrindo em tela cheia com navegação rápida pelo controle remoto!
              </span>
            </div>
          </div>

          {/* Direct trigger if browser supports it */}
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalled ? "Aplicativo Instalado!" : "Instalar Aplicativo PWA Agora"}</span>
          </button>
        </div>

        {/* Método 2: Pacote Tizen Studio para Desenvolvedores */}
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-gray-300 font-extrabold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-gray-200">
              Modo Desenvolvedor / Tizen Studio (.wgt)
            </h3>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Se você utiliza o Tizen Studio ou modo desenvolvedor na Smart TV Samsung, os arquivos de manifesto Tizen (<code>config.xml</code> e <code>index.html</code>) já estão configurados na pasta <code>/public/tizen/</code> com suporte a áudio, vídeo e tela cheia contínua.
          </p>

          <a
            href="/tizen/config.xml"
            download="config.xml"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Baixar config.xml Tizen</span>
          </a>
        </div>
      </div>
    </div>
  );
};
