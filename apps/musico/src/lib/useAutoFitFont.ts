import { useLayoutEffect, useRef } from 'react';

/**
 * Mede a linha mais larga (acorde ou letra) dentro do container e encolhe
 * o font-size automaticamente até caber na largura disponível — sem nunca
 * precisar de rolagem horizontal, em celular, tablet ou desktop.
 *
 * `desiredPct` é o tamanho que o usuário pediu (via A+/A-); este hook só
 * reduz abaixo disso quando não cabe, nunca aumenta além do pedido.
 */
export function useAutoFitFont(desiredPct: number, deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function fit() {
      if (!container) return;
      container.style.fontSize = `${desiredPct}%`;

      requestAnimationFrame(() => {
        const lines = container!.querySelectorAll<HTMLElement>('.chord-line, .lyric-line');
        if (!lines.length) return;

        let maxScroll = 0;
        let clientWidth = Infinity;
        lines.forEach((el) => {
          if (el.scrollWidth > maxScroll) maxScroll = el.scrollWidth;
          clientWidth = Math.min(clientWidth, el.clientWidth || clientWidth);
        });
        if (!isFinite(clientWidth) || clientWidth <= 0 || maxScroll <= clientWidth) return;

        const current = parseFloat(getComputedStyle(container!).fontSize);
        const target = Math.max(8, current * (clientWidth / maxScroll) * 0.97);
        container!.style.fontSize = `${target}px`;
      });
    }

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desiredPct, ...deps]);

  return containerRef;
}
