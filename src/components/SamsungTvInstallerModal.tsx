"use client";

import React, { useState } from "react";
import {
  X,
  Tv,
  Download,
  CheckCircle2,
  AlertTriangle,
  MonitorPlay,
  Laptop,
  HelpCircle,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface SamsungTvInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SamsungTvInstallerModal: React.FC<SamsungTvInstallerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"direct" | "native">("direct");
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://full-tv-streams.vercel.app";

  const copyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[#0d1017] border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Instalar na Smart TV Samsung
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-black">
                  Tizen OS
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Saiba como usar o Full TV Streams diretamente na sua televisão
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

        {/* Alerta explicativo sobre o bloqueio do Tizen */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-200 text-xs sm:text-sm leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 block mb-1">
              Por que a TV mostra &ldquo;Esta função não é suportada&rdquo;?
            </strong>
            As Smart TVs Samsung (Tizen) <strong>não possuem gerenciador de downloads</strong> e
            bloqueiam a instalação de PWAs comuns no navegador da TV por segurança. Para instalar o
            aplicativo nativo, o pacote deve ser enviado do <strong>Computador</strong> para a TV
            via Wi-Fi, ou você pode usar o atalho direto do navegador abaixo.
          </div>
        </div>

        {/* Seletor de Método */}
        <div className="grid grid-cols-2 gap-2 bg-[#121620] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab("direct")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "direct"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Método 1: Sem Computador (Mais Rápido)</span>
          </button>
          <button
            onClick={() => setActiveTab("native")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "native"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Método 2: App Nativo (.wgt via PC)</span>
          </button>
        </div>

        {/* ================= ABA 1: DIRETO NA TV (SEM PC) ================= */}
        {activeTab === "direct" && (
          <div className="space-y-4">
            <div className="bg-[#121620] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3 text-xs sm:text-sm text-gray-300">
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-xs flex items-center justify-center font-extrabold">
                  1
                </span>
                Fixar na Barra Rápida / Página Inicial da TV Samsung
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Este método não exige computador nem modo desenvolvedor e permite abrir o site em
                tela cheia com 1 clique direto no controle remoto da TV:
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <div>
                    <strong className="text-white block">Abra o Navegador na TV Samsung</strong>
                    <span>Pressione Home no controle e abra o aplicativo <strong>Internet (Navegador)</strong>.</span>
                  </div>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <div className="flex-1">
                    <strong className="text-white block">Digite o endereço do seu site:</strong>
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="text-xs font-mono text-emerald-400 bg-black/70 px-2.5 py-1.5 rounded border border-emerald-500/30 break-all select-all">
                        {currentUrl}
                      </code>
                      <button
                        onClick={copyUrl}
                        className="text-xs font-bold px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedUrl ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <div>
                    <strong className="text-white block">Fixar no Menu / Smart Hub:</strong>
                    <span>
                      No canto superior do navegador da TV, clique no ícone de <strong>Estrela (Favoritos)</strong> ou nas configurações (engrenagem) e selecione <strong>&ldquo;Adicionar à Barra Rápida&rdquo;</strong> ou <strong>&ldquo;Fixar no Smart Hub&rdquo;</strong>.
                    </span>
                  </div>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">4.</span>
                  <div>
                    <strong className="text-white block">Abrir direto em Tela Cheia:</strong>
                    <span>
                      Nas configurações do navegador da TV, marque a opção <strong>&ldquo;Ao Iniciar &rarr; Abrir Última Página&rdquo;</strong>. Assim que você clicar no ícone, ele abrirá direto no Full TV Streams sem precisar digitar nada!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA 2: APP NATIVO VIA PC (.WGT) ================= */}
        {activeTab === "native" && (
          <div className="space-y-4">
            <div className="bg-[#121620] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-xs flex items-center justify-center font-extrabold">
                    2
                  </span>
                  Instalar Pacote Nativo Tizen (.wgt)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  App Nativo Real
                </span>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Este método instala o aplicativo como um ícone nativo no menu principal da TV
                (Smart Hub) ao lado de Netflix e YouTube. O processo é feito uma única vez a partir
                do seu computador:
              </p>

              {/* Botão de Download do Pacote .wgt (para baixar no PC) */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <strong className="text-white block text-sm">Pacote do Aplicativo: FullTV.wgt</strong>
                  <span className="text-xs text-gray-400">
                    Contém o manifesto oficial Tizen, ícone Full TV e script de conexão com a Vercel.
                  </span>
                </div>
                <a
                  href="/tizen/FullTV.wgt"
                  download="FullTV.wgt"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar FullTV.wgt (no PC)</span>
                </a>
              </div>

              {/* Passos de instalação */}
              <div className="space-y-2.5 pt-1">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">Passo 1:</span>
                  <div>
                    <strong className="text-white block">Ativar o Modo Desenvolvedor na TV Samsung:</strong>
                    <span className="text-gray-300">
                      Na TV, vá no menu <strong>Apps</strong>. No controle remoto, digite a sequência de números <strong>1 2 3 4 5</strong>. Uma janela secreta chamada &ldquo;Developer Mode&rdquo; se abrirá. Ative para <strong>ON</strong> e digite o IP local do seu computador. Clique em OK e reinicie a TV (segure o botão Liga/Desliga por 5 segundos até aparecer o logo).
                    </span>
                  </div>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">Passo 2:</span>
                  <div>
                    <strong className="text-white block">Enviar o aplicativo do PC para a TV:</strong>
                    <span className="text-gray-300">
                      No computador (na mesma rede Wi-Fi da TV), você pode usar o programa gratuito{" "}
                      <a
                        href="https://github.com/reisxd/TizenBrewInstaller/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 underline font-bold inline-flex items-center gap-1"
                      >
                        TizenBrewInstaller para Windows <ExternalLink className="w-3 h-3 inline" />
                      </a>{" "}
                      ou executar o script <code>instalar-tv-samsung.bat</code> disponível na pasta do projeto.
                    </span>
                  </div>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">Passo 3:</span>
                  <div>
                    <strong className="text-white block">Pronto! Ícone Nativo Criado:</strong>
                    <span className="text-emerald-300">
                      O aplicativo <strong>Full TV Streams</strong> aparecerá na barra de aplicativos da sua TV Samsung para sempre, com suporte completo ao controle remoto!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-xs text-gray-500">Full TV Streams v1.0 • Samsung Tizen</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
