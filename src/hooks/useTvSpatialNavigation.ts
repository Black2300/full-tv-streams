"use client";

import { useEffect } from "react";

/**
 * Hook para navegação espacial de Smart TV (Controle Remoto com D-Pad)
 * Permite navegar por botões e cards usando as setas do controle remoto
 * sem precisar do ponteiro de mouse lento.
 */
export function useTvSpatialNavigation() {
  useEffect(() => {
    // Registra chaves Tizen caso o app rode em ambiente Tizen
    try {
      if (typeof window !== "undefined" && (window as any).tizen && (window as any).tizen.tvinputdevice) {
        const keys = [
          "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Return",
          "MediaPlay", "MediaPause", "MediaPlayPause", "MediaStop",
          "MediaFastForward", "MediaRewind"
        ];
        keys.forEach((k) => {
          try {
            (window as any).tizen.tvinputdevice.registerKey(k);
          } catch (e) {}
        });
      }
    } catch (e) {}

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se o usuário estiver digitando em um input de texto
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        if (e.key === "Escape" || e.keyCode === 10009) {
          (active as HTMLElement).blur();
        }
        return;
      }

      // Códigos de tecla Tizen / Navegadores TV
      // 37: Left, 38: Up, 39: Right, 40: Down, 13: Enter, 10009: Tizen Back
      const isUp = e.key === "ArrowUp" || e.keyCode === 38;
      const isDown = e.key === "ArrowDown" || e.keyCode === 40;
      const isLeft = e.key === "ArrowLeft" || e.keyCode === 37;
      const isRight = e.key === "ArrowRight" || e.keyCode === 39;
      const isEnter = e.key === "Enter" || e.keyCode === 13;

      if (!isUp && !isDown && !isLeft && !isRight && !isEnter) {
        return;
      }

      // Lista todos os elementos navegáveis visíveis
      const selector = 'button:not([disabled]), [tabindex="0"], a[href], input:not([disabled])';
      const rawElements = Array.from(document.querySelectorAll<HTMLElement>(selector));
      const focusables = rawElements.filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== "hidden";
      });

      if (focusables.length === 0) return;

      // Se nenhum elemento tiver foco atual
      const current = active as HTMLElement | null;
      const hasCurrent = current && focusables.includes(current);

      if (!hasCurrent) {
        if (isEnter) return;
        // Foca no primeiro elemento navegável disponível
        e.preventDefault();
        const first = focusables[0];
        first.focus();
        first.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        return;
      }

      if (isEnter) {
        // Deixa o evento Enter disparar o click normal do elemento
        return;
      }

      // Navegação direcional 2D
      e.preventDefault();
      const currentRect = current.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let bestTarget: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const candidate of focusables) {
        if (candidate === current) continue;

        const rect = candidate.getBoundingClientRect();
        const candidateCenterX = rect.left + rect.width / 2;
        const candidateCenterY = rect.top + rect.height / 2;

        const dx = candidateCenterX - currentCenterX;
        const dy = candidateCenterY - currentCenterY;

        let isValidDirection = false;
        let distance = Infinity;

        if (isRight && dx > 8) {
          // Peso maior para desvio vertical para se manter na mesma linha horizontal
          isValidDirection = true;
          distance = dx + Math.abs(dy) * 2.5;
        } else if (isLeft && dx < -8) {
          isValidDirection = true;
          distance = Math.abs(dx) + Math.abs(dy) * 2.5;
        } else if (isDown && dy > 8) {
          // Peso maior para desvio horizontal para preferir o item logo abaixo
          isValidDirection = true;
          distance = dy + Math.abs(dx) * 1.5;
        } else if (isUp && dy < -8) {
          isValidDirection = true;
          distance = Math.abs(dy) + Math.abs(dx) * 1.5;
        }

        if (isValidDirection && distance < minDistance) {
          minDistance = distance;
          bestTarget = candidate;
        }
      }

      if (bestTarget) {
        bestTarget.focus();
        bestTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
