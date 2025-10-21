import React, { useEffect, useCallback } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    shouldConfirmOnClose?: boolean;
    hasUnsavedChanges?: boolean;
    confirmMessage?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, shouldConfirmOnClose = false, hasUnsavedChanges = false, confirmMessage }) => {
    const attemptClose = useCallback(() => {
        if (shouldConfirmOnClose && hasUnsavedChanges) {
            const ok = window.confirm(confirmMessage || 'You have unsaved changes. Discard them?');
            if (!ok) return;
        }
        onClose();
    }, [shouldConfirmOnClose, hasUnsavedChanges, confirmMessage, onClose]);

    // Cerrar con Escape a nivel de documento (fiable aunque el foco esté en inputs)
    const handleDocumentKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            attemptClose();
        }
    }, [attemptClose]);

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', handleDocumentKeyDown);
        return () => {
            document.removeEventListener('keydown', handleDocumentKeyDown);
        };
    }, [isOpen, handleDocumentKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col"
                tabIndex={-1}
                autoFocus
            >
                <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-slate-700">{title}</h2>
                    <button
                        onClick={attemptClose}
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="Cerrar modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
