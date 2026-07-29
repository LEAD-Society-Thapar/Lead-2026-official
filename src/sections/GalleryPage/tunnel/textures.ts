// Numbered placeholder cards ("IMAGE 1" … "IMAGE N") standing in for real
// photos. Swap the interior of drawPlaceholder for actual artwork later.

export interface PhotoTex {
  canvas: HTMLCanvasElement
  aspect: number // width / height, including the frame
}

const ASPECTS = [3 / 4, 4 / 5, 1, 4 / 3]

function drawPlaceholder(ctx: CanvasRenderingContext2D, w: number, h: number, label: string) {
  // flat placeholder interior
  ctx.fillStyle = '#191919'
  ctx.fillRect(0, 0, w, h)

  // classic placeholder cross
  ctx.strokeStyle = 'rgba(245,243,238,0.28)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w, h)
  ctx.moveTo(w, 0)
  ctx.lineTo(0, h)
  ctx.stroke()

  // inner hairline
  ctx.strokeStyle = 'rgba(245,243,238,0.35)'
  ctx.strokeRect(6, 6, w - 12, h - 12)

  // centred label chip
  const label2 = label.toUpperCase()
  ctx.font = `700 ${Math.round(h * 0.11)}px 'Space Grotesk', 'Segoe UI', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const tw = ctx.measureText(label2).width
  const padX = h * 0.05
  const chipW = tw + padX * 2
  const chipH = h * 0.16
  ctx.fillStyle = '#f5f3ee'
  ctx.fillRect(w / 2 - chipW / 2, h / 2 - chipH / 2, chipW, chipH)
  ctx.fillStyle = '#101010'
  ctx.fillText(label2, w / 2, h / 2 + h * 0.008)
}

export function makePhotoSet(count: number): PhotoTex[] {
  const out: PhotoTex[] = []
  for (let i = 0; i < count; i++) {
    const aspect = ASPECTS[i % ASPECTS.length]
    const H = 440
    const W = Math.round(H * aspect)
    const border = Math.round(H * 0.055)

    const canvas = document.createElement('canvas')
    canvas.width = W + border * 2
    canvas.height = H + border * 2
    const ctx = canvas.getContext('2d')!

    // paper frame
    ctx.fillStyle = '#f6f2ea'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // placeholder interior
    ctx.save()
    ctx.translate(border, border)
    ctx.beginPath()
    ctx.rect(0, 0, W, H)
    ctx.clip()
    drawPlaceholder(ctx, W, H, `Image ${i + 1}`)
    ctx.restore()

    // hairline edges
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'
    ctx.strokeRect(border - 1, border - 1, W + 2, H + 2)

    out.push({ canvas, aspect: canvas.width / canvas.height })
  }
  return out
}
