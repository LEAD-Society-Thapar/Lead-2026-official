import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE = [0.65, 0, 0.35, 1];

export function Preloader({
  videoSrc = '/preloader-bg.mp4',
  onComplete = () => {},
}) {
  const videoRef = useRef(null);
  const exitFiredRef = useRef(false);

  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  // Start playback — some browsers need an explicit .play() call
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => triggerExit()); // if autoplay is blocked, just exit
    }
  }, []);

  // Exit sequence: fade out → unmount → call onComplete
  function triggerExit() {
    if (exitFiredRef.current) return;
    exitFiredRef.current = true;
    setExiting(true);
    setTimeout(() => {
      setDone(true);
      onComplete();
    }, 700); // matches the fade-out transition duration
  }

  if (done) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483000,
            background: '#000',
            overflow: 'hidden',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            playsInline
            autoPlay
            preload="auto"
            onEnded={triggerExit}
            onError={triggerExit}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
