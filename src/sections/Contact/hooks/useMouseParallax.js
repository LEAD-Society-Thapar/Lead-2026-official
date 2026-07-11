import { useState, useEffect } from 'react';

/**
 * Hook to track mouse movement relative to an element and return 3D rotation angles
 * and reflection coordinates for realistic glassmorphism effects.
 */
export default function useMouseParallax(ref, options = { maxRotation: 6 }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [reflect, setReflect] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Get mouse position relative to center of element
      const mouseX = e.clientX - rect.left - width / 2;
      const mouseY = e.clientY - rect.top - height / 2;

      // Normalize values from -1 to 1, then scale to maxRotation
      const rotateX = -(mouseY / (height / 2)) * options.maxRotation;
      const rotateY = (mouseX / (width / 2)) * options.maxRotation;

      // Calculate reflection percentage
      const reflectX = ((e.clientX - rect.left) / width) * 100;
      const reflectY = ((e.clientY - rect.top) / height) * 100;

      setRotate({ x: rotateX, y: rotateY });
      setReflect({ x: reflectX, y: reflectY });
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      // Smooth reset back to center
      setRotate({ x: 0, y: 0 });
      setReflect({ x: 50, y: 50 });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, options.maxRotation]);

  return { rotate, reflect, isHovered };
}
