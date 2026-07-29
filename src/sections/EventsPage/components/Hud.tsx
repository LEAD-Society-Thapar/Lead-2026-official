import { clamp, smoothstep } from '../lib/phases';

type Props = { progress: number };

export function Hud({ progress }: Props) {
  // Chrome is present on the opening frame, recedes as you enter the barrel,
  // and re-appears during the closing phase.
  const openChrome = 1 - smoothstep(0.04, 0.18, progress);
  const closeChrome = smoothstep(0.82, 0.94, progress);
  const chrome = Math.max(openChrome, closeChrome);
  const hint = (1 - smoothstep(0.02, 0.12, progress)) * openChrome;

  return (
    <div className="hud" aria-hidden={chrome < 0.05}>

      <div className="hud__hint" style={{ opacity: hint }}>
        <span>SCROLL</span>
        <span className="hud__hint-arrow">&darr;</span>
      </div>

      <div className="hud__progress" aria-hidden="true">
        <div className="hud__progress-fill" style={{ transform: `scaleX(${clamp(progress)})` }} />
      </div>
    </div>
  );
}
