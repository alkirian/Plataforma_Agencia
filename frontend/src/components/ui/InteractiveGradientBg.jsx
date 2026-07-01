// src/components/ui/InteractiveGradientBg.jsx
import React, { useEffect, useRef } from 'react';

export const InteractiveGradientBg = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false, opacity: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = 300); // Low-res canvas for perfect performance
    let height = (canvas.height = 300);
    let time = 0;

    // Resizing scales internal canvas coordinate grid but keeps low resolution for CSS blur efficiency
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = 300;
      height = canvas.height = 300;
    };
    window.addEventListener('resize', handleResize);

    // Track mouse coordinates normalized to canvas resolution
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      mouseRef.current.targetX = (e.clientX - rect.left) * scaleX;
      mouseRef.current.targetY = (e.clientY - rect.top) * scaleY;
      mouseRef.current.active = true;
      mouseRef.current.opacity = 1;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initial spotlight coordinates set to center
    mouseRef.current.x = width / 2;
    mouseRef.current.y = height / 2;

    // Premium Floating Color Blobs State
    const blobs = [
      {
        x: 0,
        y: 0,
        radius: 120,
        colorStart: 'rgba(78, 205, 196, 0.28)', // Glowing Turquoise
        colorEnd: 'rgba(78, 205, 196, 0)',
        speedX: 0.0004,
        speedY: 0.0003,
        amplitudeX: 0.35,
        amplitudeY: 0.25,
        offsetX: 0.25,
        offsetY: 0.3
      },
      {
        x: 0,
        y: 0,
        radius: 140,
        colorStart: 'rgba(124, 92, 252, 0.24)', // Deep Purple/Violet
        colorEnd: 'rgba(124, 92, 252, 0)',
        speedX: 0.0003,
        speedY: 0.0005,
        amplitudeX: 0.28,
        amplitudeY: 0.32,
        offsetX: 0.75,
        offsetY: 0.65
      }
    ];

    // Main 60fps render animation loop
    const animate = () => {
      time += 16.67; // Simulated steady delta time for animation consistency

      const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';

      // 1. Clear with theme-aware background color
      ctx.fillStyle = isLightMode ? '#f0f2f5' : '#030306';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Floating Blobs
      blobs.forEach((blob, idx) => {
        // Organic sinusoidal floating paths
        blob.x = width * (blob.offsetX + Math.sin(time * blob.speedX) * blob.amplitudeX);
        blob.y = height * (blob.offsetY + Math.cos(time * blob.speedY) * blob.amplitudeY);

        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        
        // Theme-aware colors for blobs
        let colorStart, colorEnd;
        if (isLightMode) {
          if (idx === 0) {
            colorStart = 'rgba(24, 119, 242, 0.08)'; // Soft Facebook Blue
          } else {
            colorStart = 'rgba(124, 92, 252, 0.06)'; // Soft Lavender
          }
          colorEnd = 'rgba(24, 119, 242, 0)';
        } else {
          colorStart = blob.colorStart;
          colorEnd = blob.colorEnd;
        }

        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Elastic Mouse-Tracked Spotlight Glow
      const mouse = mouseRef.current;
      // Lerp smoothing (linear interpolation creates smooth lagging inertia)
      if (isFinite(mouse.targetX) && isFinite(mouse.targetY)) {
        if (!isFinite(mouse.x)) mouse.x = width / 2;
        if (!isFinite(mouse.y)) mouse.y = height / 2;
        mouse.x += (mouse.targetX - mouse.x) * 0.075;
        mouse.y += (mouse.targetY - mouse.y) * 0.075;
      }

      // Gentle fade in/out of mouse spotlight
      if (mouse.active) {
        mouse.opacity += (1 - mouse.opacity) * 0.05;
      } else {
        mouse.opacity += (0 - mouse.opacity) * 0.03;
      }

      if (mouse.opacity > 0.01 && isFinite(mouse.x) && isFinite(mouse.y)) {
        const spotRadius = 90;
        const spotlightGradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          spotRadius
        );
        
        // Theme-aware spotlight color
        const spotlightColor = isLightMode
          ? `rgba(24, 119, 242, ${0.05 * mouse.opacity})`
          : `rgba(78, 205, 196, ${0.16 * mouse.opacity})`;

        spotlightGradient.addColorStop(0, spotlightColor);
        spotlightGradient.addColorStop(1, isLightMode ? 'rgba(24, 119, 242, 0)' : 'rgba(78, 205, 196, 0)');

        ctx.fillStyle = spotlightGradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, spotRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Clean up event listeners and animation frames on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-0"
      style={{
        // Premium CSS filters: massive blur + slight saturation boost
        // Hardware accelerated with backface-visibility and translate3d
        filter: 'blur(120px) saturate(135%)',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        opacity: 0.85
      }}
    />
  );
};
