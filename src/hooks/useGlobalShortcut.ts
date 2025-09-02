import { useCallback, useEffect } from 'react';

interface UseNewShortcutOptions {
  enabled?: boolean;
  isModalOpen?: boolean;
  onNew: () => void;
}

// Escucha la tecla 'n' para abrir el modal de creación en la página actual
// Ignora cuando el foco está en campos de entrada o cuando hay un modal abierto
export function useNewShortcut({ enabled = true, isModalOpen = false, onNew }: UseNewShortcutOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || isModalOpen) return;

    // Evitar conflictos con combinaciones y repetición
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // No disparar si el usuario está escribiendo en un input/textarea/select o contentEditable
    const target = e.target as HTMLElement | null;
    const isTyping = !!target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable ||
      target.getAttribute('role') === 'textbox'
    );
    if (isTyping) return;

    if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      e.stopPropagation();
      onNew();
    }
  }, [enabled, isModalOpen, onNew]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

