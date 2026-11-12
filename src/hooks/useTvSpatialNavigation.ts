"use client";

import { useEffect } from "react";

/**
 * Motor Profissional de Navegação Espacial de Smart TV (D-Pad)
 * Transforma o aplicativo em uma experiência 100% nativa de TV,
 * navegando suavemente entre sidebar, banner e carrosséis com as setas do controle remoto.
 */
export function useTvSpatialNavigation() {
  useEffect(() => {
    // 1. Registra todas as teclas de controle remoto no Tizen
    try {
      if (typeof window !== "undefined" && (window as any).tizen && (window as any).tizen.tvinputdevice) {
        const keys = [
          "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Return",
          "MediaPlay", "MediaPause", "MediaPlayPause", "MediaStop",
          "MediaFastForward", "MediaRewind", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
        ];
        keys.forEach((k) => {
          try {
            (window as any).tizen.tvinputdevice.registerKey(k);
          } catch (e) {}
        });
      }
    } catch (e) {}

    // 2. Foco inicial automático (evita cair na barra de busca)
    const setInitialTvFocus = () => {
      // Prioridade 0: Modal ativo (evita navegar por baixo de modais abertos)
      const activeModal = document.querySelector<HTMLElement>('[data-tv-modal="true"]');
      if (activeModal) {
        const modalTarget =
          activeModal.querySelector<HTMLElement>('[data-tv-modal-primary="true"]') ||
          activeModal.querySelector<HTMLElement>('button:not([data-tv-close="true"])') ||
          activeModal.querySelector<HTMLElement>('button');
        if (modalTarget) {
          modalTarget.focus();
          return;
        }
      }

      // Prioridade 1: Botão "Assistir Agora" do HeroBanner
      const heroPlayBtn = document.querySelector<HTMLElement>('button[data-tv-hero="true"]');
      if (heroPlayBtn) {
        heroPlayBtn.focus();
        return;
      }
      // Prioridade 2: Primeiro card de filme ou canal
      const firstCard = document.querySelector<HTMLElement>('main [tabindex="0"]');
      if (firstCard) {
        firstCard.focus();
        return;
      }
      // Prioridade 3: Primeiro botão do menu
      const firstNav = document.querySelector<HTMLElement>('aside nav button');
      if (firstNav) {
        firstNav.focus();
      }
    };

    const timer = setTimeout(setInitialTvFocus, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const activeModal = document.querySelector<HTMLElement>('[data-tv-modal="true"]');

      // Códigos de tecla TV
      const isUp = e.key === "ArrowUp" || e.keyCode === 38;
      const isDown = e.key === "ArrowDown" || e.keyCode === 40;
      const isLeft = e.key === "ArrowLeft" || e.keyCode === 37;
      const isRight = e.key === "ArrowRight" || e.keyCode === 39;
      const isEnter = e.key === "Enter" || e.keyCode === 13;
      const isBack = e.key === "Escape" || e.keyCode === 10009 || e.key === "GoBack";

      if (!isUp && !isDown && !isLeft && !isRight && !isEnter && !isBack) {
        return;
      }

      // Se o usuário apertar Voltar
      if (isBack) {
        // Se houver modal ativo, fecha o modal primeiro
        if (activeModal) {
          e.preventDefault();
          e.stopPropagation();
          const closeBtn = activeModal.querySelector<HTMLElement>('[data-tv-close="true"], button[title="Fechar"]');
          if (closeBtn) {
            closeBtn.click();
            return;
          }
        }

        // Se estiver em um input, sai do input
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
          active.blur();
          setInitialTvFocus();
          return;
        }

        // Se houver botão de fechar geral
        const closeBtn = document.querySelector<HTMLElement>('button[data-tv-close="true"], button[title="Fechar"]');
        if (closeBtn) {
          closeBtn.click();
          return;
        }
      }

      // Se estiver preso em um campo de busca/texto e apertar setas, SAI DO CAMPO
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        if (isDown || isRight || isUp) {
          e.preventDefault();
          active.blur();

          if (isRight) {
            // Pula para o conteúdo principal
            const mainTarget = document.querySelector<HTMLElement>('main button, main [tabindex="0"]');
            if (mainTarget) {
              mainTarget.focus();
              mainTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
              return;
            }
          }

          // Desce para os botões do menu abaixo da busca
          const nextNav = document.querySelector<HTMLElement>('aside nav button');
          if (nextNav) {
            nextNav.focus();
            nextNav.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            return;
          }
        }
        return;
      }

      // Seletor de todos os elementos interativos
      const selector = 'button:not([disabled]), [tabindex="0"], a[href], input:not([disabled])';
      
      // ISOLA 100% a navegação se houver modal aberto: NUNCA deixa vazar para os filmes de trás!
      const container: HTMLElement | Document = activeModal || document;

      // Se há um modal e o foco atual ainda está fora dele (ex: no card que abriu o modal), puxa o foco para dentro do modal
      if (activeModal && (!active || !activeModal.contains(active))) {
        e.preventDefault();
        const primaryTarget =
          activeModal.querySelector<HTMLElement>('[data-tv-modal-primary="true"]') ||
          activeModal.querySelector<HTMLElement>('button:not([data-tv-close="true"])') ||
          activeModal.querySelector<HTMLElement>('button');
        if (primaryTarget) {
          primaryTarget.focus();
        }
        return;
      }

      const allFocusables = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== "hidden";
      });

      if (allFocusables.length === 0) return;

      // Se nenhum elemento tiver foco, foca no início do container
      if (!active || !allFocusables.includes(active)) {
        if (isEnter) return;
        e.preventDefault();
        if (activeModal) {
          allFocusables[0]?.focus();
        } else {
          setInitialTvFocus();
        }
        return;
      }

      // Enter aciona o clique
      if (isEnter) {
        return;
      }

      e.preventDefault();

      const current = active;
      const inSidebar = !activeModal && current.closest("aside") !== null;
      const inMain = !activeModal && current.closest("main") !== null;
      const currentRect = current.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      // Regra 1: Se estiver na Sidebar e apertar Direita, pula direto para o conteúdo principal (fora de modal)
      if (inSidebar && isRight) {
        const mainTarget = document.querySelector<HTMLElement>('main [data-tv-hero="true"], main [tabindex="0"]');
        if (mainTarget) {
          mainTarget.focus();
          mainTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          return;
        }
      }

      // Regra 2: Se estiver no conteúdo principal, bem na esquerda, e apertar Esquerda, pula para a Sidebar (fora de modal)
      if (inMain && isLeft && currentRect.left < 280) {
        const activeNavBtn = document.querySelector<HTMLElement>('aside nav button.bg-emerald-500') ||
                             document.querySelector<HTMLElement>('aside nav button');
        if (activeNavBtn) {
          activeNavBtn.focus();
          activeNavBtn.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          return;
        }
      }

      // Cálculo direcional 2D do alvo mais próximo
      let bestTarget: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const candidate of allFocusables) {
        if (candidate === current) continue;

        const rect = candidate.getBoundingClientRect();
        const candidateCenterX = rect.left + rect.width / 2;
        const candidateCenterY = rect.top + rect.height / 2;

        const dx = candidateCenterX - currentCenterX;
        const dy = candidateCenterY - currentCenterY;

        let isValidDirection = false;
        let distance = Infinity;

        if (isRight && dx > 10) {
          // Prioriza cards na mesma linha horizontal
          isValidDirection = true;
          distance = dx + Math.abs(dy) * 3.5;
        } else if (isLeft && dx < -10) {
          isValidDirection = true;
          distance = Math.abs(dx) + Math.abs(dy) * 3.5;
        } else if (isDown && dy > 10) {
          // Prioriza cards logo abaixo na próxima linha vertical
          isValidDirection = true;
          distance = dy + Math.abs(dx) * 1.2;
        } else if (isUp && dy < -10) {
          isValidDirection = true;
          distance = Math.abs(dy) + Math.abs(dx) * 1.2;
        }

        if (isValidDirection && distance < minDistance) {
          minDistance = distance;
          bestTarget = candidate;
        }
      }

      if (bestTarget) {
        bestTarget.focus();
        if (activeModal) {
          bestTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        } else {
          bestTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
