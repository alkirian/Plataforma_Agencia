import { useEffect } from 'react';

/**
 * Custom hook to close dialogs, panels, or modals when the Escape key is pressed.
 *
 * @param {boolean} isOpen - React state indicating if the modal is open.
 * @param {function} onClose - Callback function to close the modal.
 */
export const useEscapeClose = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    // Use capture phase to ensure it runs before other handlers
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);
};
