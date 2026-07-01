import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

/**
 * Custom hook to apply premium, uniform GSAP animations to modal dialogs.
 * Uses a high-performance requestAnimationFrame loop to safely capture and animate 
 * elements once they are mounted in the DOM by Headless UI.
 * 
 * @param {boolean} isOpen - React state indicating if the modal is open.
 * @param {React.RefObject} backdropRef - Ref pointing to the background overlay backdrop.
 * @param {React.RefObject} panelRef - Ref pointing to the Dialog.Panel modal card.
 * @param {object} options - Animation configuration options.
 * @param {boolean} [options.animateContent=true] - Whether to stagger animate inner elements (inputs, buttons, headers).
 * @param {number} [options.duration=0.65] - Duration of the main panel animation in seconds.
 * @param {string} [options.ease="back.out(1.4)"] - GSAP easing equation for the panel entrance.
 */
export const useModalGsap = (isOpen, backdropRef, panelRef, options = {}) => {
  const {
    animateContent = true,
    duration = 0.65,
    ease = 'back.out(1.4)',
  } = options;

  useGSAP(() => {
    if (!isOpen) return;

    let rafId;

    const runAnimation = () => {
      const backdrop = backdropRef.current;
      const panel = panelRef.current;

      // If Headless UI hasn't fully committed the elements to the DOM yet, return false
      if (!backdrop || !panel) {
        return false;
      }

      // 1. Instantly hide and position elements synchronously to prevent any visual "flash" (flicker)
      gsap.set(backdrop, {
        opacity: 0,
        backdropFilter: 'blur(0px)',
        webkitBackdropFilter: 'blur(0px)',
      });
      gsap.set(panel, {
        opacity: 0,
        scale: 0.88,
        y: 40,
        rotateX: -12,
        transformOrigin: 'top center',
        filter: 'blur(10px)',
      });

      // 2. Backdrop Animation: Fade-in and progressive backdrop blur
      gsap.to(backdrop, {
        opacity: 1,
        backdropFilter: 'blur(8px)',
        webkitBackdropFilter: 'blur(8px)',
        duration: 0.4,
        ease: 'power2.out',
      });

      // 3. Modal Panel Animation: Premium 3D Elastic Pop + Blur Reveal
      if (panel.parentElement) {
        gsap.set(panel.parentElement, { perspective: 1200 });
      }

      gsap.to(panel, {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: duration,
        ease: ease,
        clearProps: 'transform,filter', // Clear inline props on complete to maintain responsive layout
      });

      // 4. Staggered inner elements reveal
      if (animateContent) {
        const childSelectors = [
          'h2',
          'h3',
          'h4',
          '.Dialog-title',
          'dialog-title',
          'label',
          'input:not([type="hidden"])',
          'select',
          'textarea',
          'button:not([aria-label])',
          '.btn-cyber',
          '.input-cyber',
          '.cyber-btn',
        ].join(', ');

        const targetElements = panel.querySelectorAll(childSelectors);

        // Filter out hidden, zero-sized elements, or elements handled by Framer Motion
        const visibleElements = Array.from(targetElements).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && !el.closest('.motion-div');
        });

        if (visibleElements.length > 0) {
          gsap.fromTo(
            visibleElements,
            {
              opacity: 0,
              y: 12,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              stagger: 0.03,
              ease: 'power2.out',
              delay: 0.15,
            }
          );
        }
      }

      return true; // Successfully initialized and animated
    };

    // Try to run synchronously first during the layout phase to prevent flicker
    const success = runAnimation();
    if (!success) {
      // Fallback: If elements are not yet committed to the DOM (lazy mounting by Headless UI),
      // poll with requestAnimationFrame until they are.
      const poll = () => {
        if (runAnimation()) return;
        rafId = requestAnimationFrame(poll);
      };
      rafId = requestAnimationFrame(poll);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, { dependencies: [isOpen], revertOnUpdate: true });
};
