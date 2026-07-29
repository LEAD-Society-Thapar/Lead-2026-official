import { useEffect, useRef } from 'react'
import { TunnelEngine } from '../tunnel/engine'

export default function TunnelSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new TunnelEngine(canvas)
    engine.start()
    return () => engine.destroy()
  }, [])

  return (
    <section className="tunnel">
      <canvas ref={canvasRef} className="tunnel-canvas" />
    </section>
  )
}
