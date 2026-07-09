import React, { useRef } from 'react';
import TeamHero from './TeamHero';
import ExecutiveSection from './ExecutiveSection';
import OrbCanvas from './OrbCanvas/OrbCanvas';
import { useOrbState, useExecSignal } from './hooks/useOrbState';

export default function TeamSection() {
  const orbStateRef = useOrbState();
  const execSignalRef = useExecSignal();

  return (
    <section id="team" className="team-section-wrapper">
      {/* OrbCanvas acts as the 3D background. */}
      <OrbCanvas orbStateRef={orbStateRef} execSignalRef={execSignalRef} />
      <TeamHero />
      <ExecutiveSection execSignalRef={execSignalRef} />
    </section>
  );
}
