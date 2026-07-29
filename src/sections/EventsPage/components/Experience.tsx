import { Suspense } from 'react';
import { DotGrid } from './DotGrid';
import { FloatingCards } from './FloatingCards';
import { TypographyCylinder } from './TypographyCylinder';
import { COLORS } from '../lib/constants';

type ExperienceProps = {
  progressRef: React.RefObject<number>;
};

export function Experience({ progressRef }: ExperienceProps) {
  return (
    <Suspense fallback={null}>
      <color attach="background" args={[COLORS.black]} />
      <DotGrid />
      <TypographyCylinder progressRef={progressRef} />
      <FloatingCards progressRef={progressRef} />
    </Suspense>
  );
}
