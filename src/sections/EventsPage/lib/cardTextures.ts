import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Procedurally drawn "portfolio window" textures. Each one mimics a website
// preview that floats inside the hollow centre of the spinning WORK barrel,
// matching the GENEROUS / NOD reference frames. Swap any of these for a real
// image or <video> texture by dropping a file in /public/media.
// ---------------------------------------------------------------------------

const CARD_W = 960;
const CARD_H = 600;

function makeTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  draw(ctx, CARD_W, CARD_H);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function topBar(ctx: CanvasRenderingContext2D, w: number, logo: string, items: string[], dark = false) {
  ctx.fillStyle = dark ? '#0c0c0c' : '#111111';
  ctx.font = '800 26px "Anton", system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(logo, 40, 46);
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillStyle = '#222';
  let x = w - 360;
  for (const item of items) {
    ctx.fillText(item, x, 46);
    x += ctx.measureText(item).width + 34;
  }
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
) {
  const words = text.split(' ');
  let line = '';
  let dy = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, dy);
      line = word + ' ';
      dy += lh;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, dy);
}

export type CardSpec = {
  id: string;
  label: string;
  code: string;
  make: () => THREE.Texture;
};

export const CARD_SPECS: CardSpec[] = [
  {
    id: 'generous',
    label: 'GENEROUS — BRANDING',
    code: '#3VVA-0000/34',
    make: () =>
      makeTexture((ctx, w, h) => {
        // soft studio-grey product shot
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#e9e7e1');
        g.addColorStop(1, '#d4d1c8');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // header
        ctx.fillStyle = '#fbfaf7';
        ctx.fillRect(0, 0, w, 92);
        topBar(ctx, w, 'GENEROUS', ['WORK', 'VISION', "L'AGENCE", 'CONTACT']);
        // product blocks (boxes/bottles)
        ctx.save();
        ctx.translate(w * 0.5, h * 0.56);
        ctx.rotate(-0.06);
        ctx.fillStyle = '#cfae7e';
        ctx.fillRect(-110, -70, 150, 150);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(-110, 70, 150, 18);
        ctx.fillStyle = '#f1ede4';
        ctx.fillRect(70, -120, 120, 230);
        ctx.fillStyle = '#9bbf9a';
        ctx.fillRect(86, -104, 88, 60);
        ctx.restore();
        // bottle hint
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(w * 0.5 - 26, h * 0.4, 52, 150);
        ctx.fillStyle = '#b9b3a6';
        ctx.fillRect(w * 0.5 - 18, h * 0.4 - 18, 36, 22);
      }),
  },
  {
    id: 'nod',
    label: 'NOD — CODING BOOTCAMP',
    code: '#B7VA-0003/34',
    make: () =>
      makeTexture((ctx, w, h) => {
        ctx.fillStyle = '#f4f1ea';
        ctx.fillRect(0, 0, w, h);
        topBar(ctx, w, 'no-d.', ['Bootcamp', 'B2B Courses', 'Contact']);
        ctx.fillStyle = '#2f6df6';
        ctx.beginPath();
        ctx.roundRect(w - 150, 28, 110, 38, 19);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '600 15px system-ui, sans-serif';
        ctx.fillText('Apply now', w - 132, 47);
        // playful CODING shapes
        const palette = ['#f6c75a', '#ff6a3d', '#2f6df6', '#19a36b', '#8bd3c7', '#e85b81'];
        const cx = w * 0.5 - 220;
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = palette[i];
          ctx.beginPath();
          if (i % 2 === 0) ctx.arc(cx + i * 80, 210, 46, 0, Math.PI * 2);
          else {
            ctx.moveTo(cx + i * 80 - 46, 256);
            ctx.lineTo(cx + i * 80 + 46, 256);
            ctx.lineTo(cx + i * 80, 164);
            ctx.closePath();
          }
          ctx.fill();
        }
        ctx.fillStyle = '#111';
        ctx.font = '800 60px "Anton", system-ui, sans-serif';
        ctx.fillText('bootcamp', w * 0.5 - 130, 330);
        ctx.font = '800 78px "Anton", system-ui, sans-serif';
        ctx.fillText('10 weeks', 40, h - 110);
        ctx.fillStyle = '#444';
        ctx.font = '600 16px system-ui, sans-serif';
        ctx.fillText('To start a new career in Tech', w * 0.5 + 20, h - 150);
        ctx.font = '400 13px system-ui, sans-serif';
        ctx.fillStyle = '#777';
        wrap(
          ctx,
          'Unlock the door to the future with hands-on skills. Build projects in data, ML and generative AI.',
          w * 0.5 + 20,
          h - 120,
          360,
          18,
        );
      }),
  },
  {
    id: 'coeur',
    label: 'GENEROUS — LA MARQUE AU CŒUR',
    code: '#A240-0000/34',
    make: () =>
      makeTexture((ctx, w, h) => {
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, w, 96);
        ctx.fillStyle = '#fbfaf7';
        ctx.fillRect(0, 96, w, h - 96);
        ctx.fillStyle = '#fff';
        ctx.font = '800 26px "Anton", system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('GENEROUS', 40, 48);
        ctx.font = '600 15px system-ui, sans-serif';
        let x = w - 360;
        for (const item of ['WORK', 'VISION', "L'AGENCE", 'CONTACT']) {
          ctx.fillText(item, x, 48);
          x += ctx.measureText(item).width + 34;
        }
        ctx.fillStyle = '#0c0c0c';
        ctx.font = '800 92px "Anton", system-ui, sans-serif';
        ctx.fillText('LA MARQUE', 44, 220);
        ctx.fillText('AU CŒUR', 44, 320);
        ctx.fillStyle = '#555';
        ctx.font = '600 19px system-ui, sans-serif';
        wrap(
          ctx,
          'LA MARQUE AU CŒUR DE LA STRATÉGIE, DE L’IDENTITÉ, DU DESIGN — POUR GENEROUS C’EST LA',
          w * 0.52,
          250,
          380,
          28,
        );
      }),
  },
  {
    id: 'durance',
    label: 'DURANCE — CONSCIOUS CRAFT',
    code: '#1440-0004/34',
    make: () =>
      makeTexture((ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#1c2330');
        g.addColorStop(1, '#0c1118');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#e8e6df';
        ctx.font = '600 15px system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('DURANCE', 40, 46);
        ctx.fillText('CONSCIOUS · WORK · ABOUT · CONTACT', w - 420, 46);
        // architectural beige columns
        const cols = ['#d9c7a3', '#c9b491', '#e3d6bb', '#bfa985'];
        cols.forEach((c, i) => {
          ctx.fillStyle = c;
          const ch = 230 + (i % 2) * 70;
          ctx.fillRect(140 + i * 180, h - 110 - ch, 120, ch);
        });
        ctx.fillStyle = '#f3f1ea';
        ctx.font = '800 70px "Anton", system-ui, sans-serif';
        ctx.fillText('DURANCE', 44, 150);
      }),
  },
];
