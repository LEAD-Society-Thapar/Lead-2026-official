import { Canvas } from '@react-three/fiber';
import { useCallback, useRef, useState } from 'react';
import { Experience } from './components/Experience';
import { InteractiveGrid } from './components/InteractiveGrid';
import { PillOpening } from './components/PillOpening';
import { Hud } from './components/Hud';
import { useScrollTimeline } from './hooks/useScrollTimeline';
import './styles/app.css';

export default function App() {
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  const onProgress = useCallback((value: number) => {
    progressRef.current = value;
    setProgress(value);
  }, []);

  useScrollTimeline(onProgress);

  return (
    <div className="site">
      <section id="events" className="events">
        <div id="stage" className="stage">
          <Canvas
            className="stage__canvas"
            camera={{ position: [0, 0, 10], fov: 40, near: 0.1, far: 100 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          >
            <Experience progressRef={progressRef} />
          </Canvas>

          <InteractiveGrid progress={progress} />
          <PillOpening progress={progress} />
          <Hud progress={progress} />
        </div>
      </section>
    </div>
  );
}
