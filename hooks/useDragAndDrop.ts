
import { useEffect } from 'react';

export const useDragAndDrop = () => {
    useEffect(() => {
        const overlay = document.getElementById('drag-drop-overlay');
        if (!overlay) return;

        const show = (e: DragEvent) => {
            e.preventDefault();
            overlay.classList.remove('opacity-0');
            overlay.classList.add('opacity-100');
        };
        const hide = (e: DragEvent) => {
            e.preventDefault();
            overlay.classList.remove('opacity-100');
            overlay.classList.add('opacity-0');
        };
        const preventDefault = (e: DragEvent) => e.preventDefault();
        
        window.addEventListener('dragenter', show);
        window.addEventListener('dragover', preventDefault); // Important for drop to work
        window.addEventListener('dragleave', (e) => {
            // Only hide if leaving the window entirely
            if (e.relatedTarget === null) {
                hide(e);
            }
        });
        window.addEventListener('drop', hide);

        return () => {
            window.removeEventListener('dragenter', show);
            window.removeEventListener('dragover', preventDefault);
            window.removeEventListener('dragleave', hide);
            window.removeEventListener('drop', hide);
        };
    }, []);
};
