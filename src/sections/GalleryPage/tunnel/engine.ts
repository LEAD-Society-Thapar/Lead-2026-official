// Tunnel scene: radial rays converging on a smiley "pit", photo prints and
// geometric doodads flying out of the vanishing point toward the viewer.
// Photos can be snatched with the pointer; releasing one dissolves it into
// pixel blocks. Plain Canvas 2D, no dependencies.

import { makePhotoSet, type PhotoTex } from './textures'

const BG = '#0e0e0e'
const INK = '#f5f3ee'
const TWO_PI = Math.PI * 2

const Z_SPAWN = 11
// items live until they are practically at the camera plane; combined with
// the near-fade this reads as flying past/through the screen
const Z_KILL = 0.12
const Z_FADE = 0.8 // depth at which the pass-through fade begins (pushed further out)
// nearing the viewer, photos stop tumbling and right themselves as if the
// air aligned them, then linger longer so the image can be fully appreciated
const Z_ALIGN = 3.2
const DIM_FALLING = 0.45 // photos fly dimmed; catching one restores brightness
const RAY_COUNT = 37
const MAX_FALLING = 8

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

// Bounding box of an image's actual subject, ignoring its empty margins. The
// mascot png carries far more empty space under the chin than above the hair,
// so centring the raw bitmap would leave the face riding high.
//
// Transparency decides what counts as empty: a cut-out is masked by its alpha,
// and only a fully opaque image falls back to treating near-white as the
// background. Line art drawn in white would otherwise erase itself.
function contentBox(img: HTMLImageElement): Rect {
  const W = img.naturalWidth
  const H = img.naturalHeight
  const off = document.createElement('canvas')
  off.width = W
  off.height = H
  const octx = off.getContext('2d')!
  octx.drawImage(img, 0, 0)
  const d = octx.getImageData(0, 0, W, H).data

  let cutOut = false
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < 24) {
      cutOut = true
      break
    }
  }

  let minX = W
  let minY = H
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      const bg = cutOut
        ? d[i + 3] < 24
        : d[i] > 244 && d[i + 1] > 244 && d[i + 2] > 244
      if (bg) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0) return { x: 0, y: 0, w: W, h: H }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

type ShapeKind = 'ring' | 'plus' | 'zig' | 'burst' | 'arc' | 'box'
const SHAPES: ShapeKind[] = ['ring', 'plus', 'zig', 'burst', 'arc', 'box']

interface Particle {
  lx: number // local x, item-centred, screen px
  ly: number
  s: number // dot size, screen px
  color: string
  t0: number // seconds after release at which the dot starts dispersing
  life: number // how long the dot takes to drift out and fade
  dvx: number // drift velocity, px/s
  dvy: number
  seed: number
}

interface Item {
  kind: 'photo' | 'shape'
  shape: ShapeKind
  tex: PhotoTex | null
  // world space while falling
  wx: number
  wy: number
  z: number
  rot: number // in-plane spin (z axis)
  vr: number
  // rigid-body tumble: rotation by `theta` about a fixed tilted axis
  ax: number
  ay: number
  az: number
  theta: number
  vtheta: number
  seed: number
  // per-card resting pose offsets so the air-settled cards never line up
  // with artificial perfection
  settleOff: number // residual 3D tilt kept after settling, radians
  settleRot: number // in-plane resting tilt, radians
  world: number // world-space height
  state: 'fall' | 'held' | 'dissolve'
  // screen space while held / dissolving
  px: number
  py: number
  vx: number
  vy: number
  sc: number // current on-screen height, px
  vsc: number
  parts: Particle[] | null
  age: number
  dim: number // 0 = full brightness, higher = darker; eases per state
}

export class TunnelEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private dpr = 1

  private items: Item[] = []
  private photos: PhotoTex[]
  private photoIdx = 0 // cycles image 1 → N in order
  private held: Item | null = null

  private mx = -9999
  private my = -9999

  private rayRot = 0
  private spawnT = 0
  private time = 0
  // background clock: eases to a stop while a photo is held, resumes on release
  private bgTime = 0
  private bgSpeed = 1
  private bgTarget = 1
  private last = 0
  private raf = 0
  private running = false

  private ro: ResizeObserver

  // mascot portrait that sits in the rim circle; drawn once it has decoded
  private mascot = new Image()
  private mascotReady = false
  private mascotBox: Rect = { x: 0, y: 0, w: 0, h: 0 }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.photos = makePhotoSet(50)

    this.mascot.onload = () => {
      this.mascotBox = contentBox(this.mascot)
      this.mascotReady = true
    }
    this.mascot.src = '/mascot.png'

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.resize()

    canvas.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerup', this.onUp)
    window.addEventListener('pointercancel', this.onUp)
    window.addEventListener('blur', this.onUp)

    if (import.meta.env.DEV) {
      // debug handle for automated checks; not part of the public API
      ;(window as unknown as Record<string, unknown>).__tunnel = this
    }
  }

  start() {
    if (this.running) return
    this.running = true
    // pre-fill so the tunnel is alive on first paint, well spaced in depth
    for (let i = 0; i < 4; i++) this.spawn(rand(3, Z_SPAWN) + i * 2)
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
  }

  destroy() {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerup', this.onUp)
    window.removeEventListener('pointercancel', this.onUp)
    window.removeEventListener('blur', this.onUp)
  }

  // ------------------------------------------------------------- sizing

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.w = Math.max(1, rect.width)
    this.h = Math.max(1, rect.height)
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
  }

  private get focal() {
    return Math.min(this.w, this.h) * 0.62
  }

  private center(): [number, number] {
    // fixed vanishing point, dead centre of the viewport
    return [this.w * 0.5, this.h * 0.5]
  }

  private project(it: Item): { x: number; y: number; hpx: number } {
    const [cx, cy] = this.center()
    const s = this.focal / it.z
    return { x: cx + it.wx * s, y: cy + it.wy * s, hpx: it.world * s }
  }

  // ------------------------------------------------------------ pointer

  private toLocal(e: PointerEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  private onMove = (e: PointerEvent) => {
    ;[this.mx, this.my] = this.toLocal(e)
    if (!this.held) {
      const hit = this.hitTest(this.mx, this.my)
      this.canvas.style.cursor = hit ? 'grab' : 'default'
    } else {
      this.canvas.style.cursor = 'grabbing'
    }
  }

  private onDown = (e: PointerEvent) => {
    ;[this.mx, this.my] = this.toLocal(e)
    const hit = this.hitTest(this.mx, this.my)
    if (!hit) return
    e.preventDefault()
    const p = this.project(hit)
    hit.state = 'held'
    hit.px = p.x
    hit.py = p.y
    // snatch impulse: fling toward the cursor so the spring overshoots
    hit.vx = (this.mx - p.x) * 9
    hit.vy = (this.my - p.y) * 9
    hit.sc = p.hpx
    hit.vsc = 0
    hit.age = 0 // held-time: drives the catch wiggle
    this.held = hit
    this.bgTarget = 0.05 // world drops to an ultra-slow crawl while a photo is in hand
    this.canvas.style.cursor = 'grabbing'
  }

  private onUp = () => {
    if (!this.held) return
    this.beginDissolve(this.held)
    this.held = null
    this.bgTarget = 1 // let the world breathe again as the photo disperses
    this.canvas.style.cursor = 'default'
  }

  private hitTest(x: number, y: number): Item | null {
    // nearest (smallest z) first
    const sorted = this.items
      // photos already sweeping past the camera plane are no longer catchable
      .filter((it) => it.kind === 'photo' && it.state === 'fall' && it.tex && it.z > Z_FADE * 1.4)
      .sort((a, b) => a.z - b.z)
    for (const it of sorted) {
      const p = this.project(it)
      // project the tumbled card's extents; keep a floor so edge-on cards
      // stay grabbable
      const { ux, uy, vx, vy } = this.cardBasis(it)
      const hW = (p.hpx / 2) * it.tex!.aspect
      const hH = p.hpx / 2
      const hw = Math.max(0.3 * hW, Math.abs(ux) * hW + Math.abs(vx) * hH) * 1.06
      const hh = Math.max(0.3 * hH, Math.abs(uy) * hW + Math.abs(vy) * hH) * 1.06
      const dx = x - p.x
      const dy = y - p.y
      const cos = Math.cos(-it.rot)
      const sin = Math.sin(-it.rot)
      const lx = dx * cos - dy * sin
      const ly = dx * sin + dy * cos
      if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) return it
    }
    return null
  }

  // ------------------------------------------------------------- spawn

  private spawn(z = Z_SPAWN) {
    const kind = Math.random() < 0.75 ? 'photo' : 'shape'
    const a = rand(0, TWO_PI)
    const r = rand(0.3, 1.15)
    this.items.push({
      kind,
      shape: pick(SHAPES),
      tex: kind === 'photo' ? this.photos[this.photoIdx++ % this.photos.length] : null,
      wx: Math.cos(a) * r,
      wy: Math.sin(a) * r * 0.9,
      z,
      rot: rand(-0.45, 0.45),
      vr: kind === 'photo' ? rand(-0.35, 0.35) : rand(-0.9, 0.9),
      ...(() => {
        // random tumble axis, kept mostly in the card plane so the motion
        // reads as end-over-end toppling rather than a flat spin
        const aa = rand(0, TWO_PI)
        const tiltZ = rand(-0.35, 0.35)
        const inv = 1 / Math.hypot(Math.cos(aa), Math.sin(aa), tiltZ)
        return {
          ax: Math.cos(aa) * inv,
          ay: Math.sin(aa) * inv,
          az: tiltZ * inv,
        }
      })(),
      theta: rand(0, TWO_PI),
      vtheta: kind === 'photo' ? rand(0.9, 1.7) * (Math.random() < 0.5 ? -1 : 1) : 0,
      seed: rand(0, 100),
      settleOff: rand(-0.16, 0.16),
      settleRot: rand(-0.22, 0.22),
      world: kind === 'photo' ? rand(0.5, 0.78) : rand(0.2, 0.38),
      state: 'fall',
      px: 0,
      py: 0,
      vx: 0,
      vy: 0,
      sc: 0,
      vsc: 0,
      parts: null,
      age: 0,
      dim: kind === 'photo' ? DIM_FALLING : 0,
    })
  }

  // ----------------------------------------------------------- dissolve

  private beginDissolve(it: Item) {
    if (!it.tex) {
      this.items = this.items.filter((x) => x !== it)
      return
    }
    const screenH = it.sc
    const screenW = screenH * it.tex.aspect

    // dust-fine dots: ~2.5px pitch on screen, capped so the particle count
    // stays within a comfortable per-frame budget
    const pitch = 2.5
    let cols = Math.round(screenW / pitch)
    let rows = Math.round(screenH / pitch)
    const budget = 16000
    if (cols * rows > budget) {
      const k = Math.sqrt(budget / (cols * rows))
      cols = Math.floor(cols * k)
      rows = Math.floor(rows * k)
    }
    cols = Math.max(40, cols)
    rows = Math.max(40, rows)

    const tmp = document.createElement('canvas')
    tmp.width = cols
    tmp.height = rows
    const tctx = tmp.getContext('2d')!
    tctx.drawImage(it.tex.canvas, 0, 0, cols, rows)
    const data = tctx.getImageData(0, 0, cols, rows).data

    const bw = screenW / cols
    const bh = screenH / rows

    const parts: Particle[] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const lx = (x + 0.5 - cols / 2) * bw
        const ly = (y + 0.5 - rows / 2) * bh
        // dots near the edges let go first, so the photo melts inward
        const edge = Math.max(Math.abs(lx) / (screenW / 2), Math.abs(ly) / (screenH / 2))
        const a = Math.atan2(ly, lx) + rand(-0.4, 0.4)
        const speed = rand(18, 55)
        parts.push({
          lx,
          ly,
          s: Math.max(bw, bh),
          color: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
          t0: (1 - edge) * 0.38 + rand(0, 0.25),
          life: rand(0.7, 1.1),
          dvx: Math.cos(a) * speed,
          dvy: Math.sin(a) * speed - rand(10, 30), // slight upward lift
          seed: Math.random() * 100,
        })
      }
    }
    it.parts = parts
    it.state = 'dissolve'
    it.age = 0

    // let go: keep a whisper of the hand's momentum and tip slightly,
    // then a gentle gravity eases the print down as it disperses
    it.vx = clamp(it.vx * 0.25, -160, 160)
    it.vy = clamp(it.vy * 0.25, -100, 80) + 25
    it.vr = clamp(it.vx * 0.001, -0.35, 0.35)
  }

  // -------------------------------------------------------------- loop

  private tick = (now: number) => {
    if (!this.running) return
    const dt = clamp((now - this.last) / 1000, 0, 0.05)
    this.last = now
    this.time += dt
    this.update(dt)
    this.render()
    this.raf = requestAnimationFrame(this.tick)
  }

  private update(dt: number) {
    // ease the background clock toward frozen (held) or running (free);
    // exponential smoothing gives a soft ramp both ways, snapped at the end
    // so the freeze is a true standstill rather than an asymptotic crawl
    this.bgSpeed += (this.bgTarget - this.bgSpeed) * Math.min(1, dt * 4.5)
    if (Math.abs(this.bgSpeed - this.bgTarget) < 0.012) this.bgSpeed = this.bgTarget
    const bdt = dt * this.bgSpeed
    this.bgTime += bdt

    this.rayRot += bdt * 0.02

    // spawn cadence (paused while frozen)
    this.spawnT -= bdt
    const falling = this.items.filter((i) => i.state === 'fall').length
    if (this.spawnT <= 0 && falling < MAX_FALLING) {
      this.spawn()
      // cadence: wider spacing so each card's presentation is fully visible
      // before the next one arrives, making the sequence easy to follow
      this.spawnT = rand(2.2, 3.0)
    }

    const dead: Item[] = []
    for (const it of this.items) {
      if (it.state === 'fall') {
        let speed = 1.1 + (Z_SPAWN - it.z) * 0.115
        // how deep the card is into the near zone (0 far → 1 close); the
        // settling below is a continuous crossfade, never a mode switch,
        // so the spin simply seems to damp out on its own
        const near =
          it.kind === 'photo'
            ? clamp((Z_ALIGN - it.z) / (Z_ALIGN - 1.2), 0, 1)
            : 0
        const s = near * near * (3 - 2 * near)

        // tumble winds down as the card nears...
        const spin = 1 - s
        it.rot += it.vr * bdt * spin
        it.theta += it.vtheta * (1 + Math.sin(this.bgTime * 1.3 + it.seed) * 0.22) * bdt * spin

        if (s > 0) {
          // ...while a growing pull eases it toward a face-on pose, kept
          // slightly imperfect by the per-card offsets
          const flat = Math.round(it.theta / TWO_PI) * TWO_PI + it.settleOff
          it.theta += (flat - it.theta) * Math.min(1, bdt * 1.8 * s)
          it.rot += (it.settleRot - it.rot) * Math.min(1, bdt * 1.4 * s)

          // the print drifts out of its travel dim so it reads clearly
          it.dim += (0.06 - it.dim) * Math.min(1, bdt * 2.0 * s)

          // and the approach relaxes just enough to leave a beat to look
          speed *= 1 - 0.72 * s
        }
        it.z -= bdt * speed
        if (it.z <= Z_KILL) {
          dead.push(it)
          continue
        }
        const p = this.project(it)
        const half = (p.hpx / 2) * Math.max(1, it.tex?.aspect ?? 1) + 40
        if (
          p.x < -half || p.x > this.w + half ||
          p.y < -half || p.y > this.h + half
        ) {
          dead.push(it)
        }
      } else if (it.state === 'held') {
        it.age += dt // held-time for the catch wiggle

        // underdamped spring toward the cursor → snatchy overshoot
        const k = 380
        const c = 17
        it.vx += ((this.mx - it.px) * k - it.vx * c) * dt
        it.vy += ((this.my - it.py) * k - it.vy * c) * dt
        it.px += it.vx * dt
        it.py += it.vy * dt

        const target = clamp(this.h * 0.36, 170, 380)
        const ks = 240
        const cs = 15
        it.vsc += ((target - it.sc) * ks - it.vsc * cs) * dt
        it.sc += it.vsc * dt

        // tilt with horizontal velocity, like a card held loosely
        const tilt = clamp(it.vx * 0.0012, -0.32, 0.32)
        it.rot += (tilt - it.rot) * Math.min(1, dt * 9)

        // flatten the tumble into the hand: settle theta to the nearest
        // full turn so the photo eases flat without snapping
        const flat = Math.round(it.theta / TWO_PI) * TWO_PI
        it.theta += (flat - it.theta) * Math.min(1, dt * 8)

        // brighten to full while in hand
        it.dim += (0 - it.dim) * Math.min(1, dt * 8)
      } else {
        it.age += dt
        // soft fall: a gentle gravity, like paper sinking through air,
        // while light drag bleeds off the sideways momentum
        it.vy += 320 * dt
        it.vx *= Math.exp(-dt * 2.2)
        it.px += it.vx * dt
        it.py += it.vy * dt
        it.rot += it.vr * dt
        // the global fade reaches zero at ~1.3s; keep a small margin
        if (it.age > 1.4) dead.push(it)
      }
    }
    if (dead.length) this.items = this.items.filter((i) => !dead.includes(i))
  }

  // ------------------------------------------------------------- render

  private render() {
    const { ctx, w, h } = this
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    ctx.fillStyle = BG
    ctx.fillRect(0, 0, w, h)

    const [cx, cy] = this.center()

    // pit depth shading
    // rays start at the smiley's rim so they never cross the face
    const R = Math.hypot(w, h)
    const r0 = Math.min(w, h) * 0.09
    ctx.strokeStyle = 'rgba(245,243,238,0.5)'
    ctx.lineWidth = 1.1
    ctx.beginPath()
    for (let i = 0; i < RAY_COUNT; i++) {
      const a = (i / RAY_COUNT) * TWO_PI + this.rayRot
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
    }
    ctx.stroke()

    this.drawSmiley(cx, cy)

    // far → near
    const falling = this.items
      .filter((i) => i.state === 'fall')
      .sort((a, b) => b.z - a.z)
    for (const it of falling) this.drawFalling(it)
    for (const it of this.items) if (it.state === 'dissolve') this.drawDissolve(it)
    if (this.held) this.drawHeld(this.held)
  }


  private drawFalling(it: Item) {
    const { ctx } = this
    const p = this.project(it)
    // fade in on arrival, fade out while sweeping past the camera plane
    const fadeIn = clamp((Z_SPAWN - it.z) / 1.1, 0, 1)
    const fadeOut = clamp((it.z - Z_KILL) / (Z_FADE - Z_KILL), 0, 1)
    const alpha = fadeIn * fadeOut * fadeOut

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(it.rot)
    ctx.globalAlpha = alpha

    if (it.kind === 'photo' && it.tex) {
      const hgt = p.hpx
      const wdt = hgt * it.tex.aspect
      this.drawCard(it, wdt, hgt)
    } else {
      this.strokeShape(it.shape, p.hpx)
    }
    ctx.restore()
  }

  private strokeShape(kind: ShapeKind, size: number) {
    const { ctx } = this
    const s = size / 2
    ctx.strokeStyle = INK
    ctx.fillStyle = INK
    ctx.lineWidth = Math.max(1.5, size * 0.13)
    ctx.lineCap = 'round'
    ctx.beginPath()
    switch (kind) {
      case 'ring':
        ctx.arc(0, 0, s, 0, TWO_PI)
        break
      case 'plus':
        ctx.moveTo(-s, 0)
        ctx.lineTo(s, 0)
        ctx.moveTo(0, -s)
        ctx.lineTo(0, s)
        break
      case 'zig': {
        const step = (s * 2) / 4
        ctx.moveTo(-s, s * 0.4)
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(-s + step * (i + 0.5), i % 2 === 0 ? -s * 0.4 : s * 0.4)
        }
        ctx.lineTo(s, -s * 0.4)
        break
      }
      case 'burst':
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI
          ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s)
          ctx.lineTo(-Math.cos(a) * s, -Math.sin(a) * s)
        }
        break
      case 'arc':
        ctx.arc(0, 0, s, Math.PI * 0.15, Math.PI * 1.15)
        break
      case 'box':
        ctx.rect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6)
        break
    }
    ctx.stroke()
  }

  private drawSmiley(cx: number, cy: number) {
    const { ctx } = this
    const r = Math.min(this.w, this.h) * 0.09

    ctx.save()
    ctx.translate(cx, cy)

    // rim circle (stationary)
    ctx.strokeStyle = INK
    ctx.lineWidth = Math.max(1.2, r * 0.025)
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, TWO_PI)
    ctx.stroke()

    // mascot face rotating 360° around center
    ctx.rotate(this.bgTime * 0.45)
    this.drawMascotFace(r)

    ctx.restore()
  }

  private drawMascotFace(rimRadius: number) {
    if (!this.mascotReady) return
    const { ctx } = this
    const box = this.mascotBox

    // the head itself — not the png's empty margins — is inscribed in the rim.
    // Since it turns a full circle, the fit is set by the portrait's diagonal,
    // which is what keeps a corner from swinging outside the ring mid-spin.
    const aspect = box.w / box.h
    const hgt = (rimRadius * 2 * 0.94) / Math.hypot(aspect, 1)
    const wdt = hgt * aspect

    ctx.drawImage(
      this.mascot,
      box.x, box.y, box.w, box.h,
      -wdt / 2, -hgt / 2, wdt, hgt,
    )
  }

  private drawHeld(it: Item) {
    if (!it.tex) return
    const { ctx } = this
    const hgt = it.sc
    const wdt = hgt * it.tex.aspect
    // catch wiggle: a quick decaying shake right after the grab
    const wiggle = Math.exp(-it.age * 5) * Math.sin(it.age * 28) * 0.14
    const pulse = 1 + Math.exp(-it.age * 6) * Math.sin(it.age * 24 + 1) * 0.035
    ctx.save()
    ctx.translate(it.px, it.py)
    ctx.rotate(it.rot + wiggle)
    ctx.scale(pulse, pulse)
    this.drawCard(it, wdt, hgt)
    ctx.restore()
  }

  // Rigid-body tumble: rotate the card by `theta` about its fixed tilted
  // axis (Rodrigues' formula), then project the card plane orthographically.
  // The resulting affine transform bends the card through natural skews
  // instead of axis-aligned squashes. Caller has already translated/rotated
  // into the card's frame.
  private cardBasis(it: Item) {
    const { ax, ay, az, theta } = it
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    const t = 1 - c
    // columns of the rotation matrix: images of the local X and Y axes,
    // plus the z of the rotated normal for lighting
    return {
      ux: t * ax * ax + c,
      uy: t * ax * ay + s * az,
      vx: t * ax * ay - s * az,
      vy: t * ay * ay + c,
      nz: t * az * az + c,
    }
  }

  private drawCard(it: Item, wdt: number, hgt: number) {
    const { ctx } = this
    const { ux, uy, vx, vy, nz } = this.cardBasis(it)
    ctx.save()
    ctx.transform(ux, uy, vx, vy, 0, 0)
    // double-sided print: the transform mirrors the image naturally when
    // the card faces away, so the picture shows from front and back alike
    ctx.drawImage(it.tex!.canvas, -wdt / 2, -hgt / 2, wdt, hgt)
    // darken as the card turns edge-on, like a face catching less light,
    // plus the state dim (falling photos are muted, held ones fully lit)
    const shade = Math.min(0.85, (1 - Math.abs(nz)) * 0.3 + it.dim)
    if (shade > 0.02) {
      ctx.fillStyle = `rgba(0,0,0,${shade.toFixed(3)})`
      ctx.fillRect(-wdt / 2, -hgt / 2, wdt, hgt)
    }
    ctx.restore()
  }

  private drawDissolve(it: Item) {
    if (!it.parts) return
    const { ctx } = this
    ctx.save()
    ctx.translate(it.px, it.py)
    ctx.rotate(it.rot)
    // the whole cloud relaxes outward very slightly as it disperses
    const breathe = 1 + Math.min(it.age, 1.2) * 0.04
    ctx.scale(breathe, breathe)
    const smooth = (t: number) => t * t * (3 - 2 * t) // smoothstep
    // simultaneous whole-image fade: the cloud thins into open air while
    // the dots are still drifting apart
    const fade = 1 - smooth(clamp((it.age - 0.12) / 1.15, 0, 1))
    for (const p of it.parts) {
      const tl = (it.age - p.t0) / p.life
      if (tl >= 1) continue
      let x = p.lx
      let y = p.ly
      let r = p.s * 0.58
      ctx.globalAlpha = fade
      if (tl > 0) {
        const e = smooth(tl)
        // gentle drift with a soft wander, no hard jitter
        x += p.dvx * e * p.life + Math.sin(it.age * 2.4 + p.seed) * 3 * e
        y += p.dvy * e * p.life + Math.cos(it.age * 2.1 + p.seed * 1.7) * 3 * e
        r *= 1 - e
        ctx.globalAlpha = (1 - e) * fade
      }
      if (r < 0.12 || ctx.globalAlpha < 0.01) continue
      ctx.fillStyle = p.color
      if (r < 2) {
        // at dust scale a square is indistinguishable from a circle and
        // draws far faster than an arc
        ctx.fillRect(x - r, y - r, r * 2, r * 2)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, TWO_PI)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }
}
