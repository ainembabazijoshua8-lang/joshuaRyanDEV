import { useEffect } from 'react';

interface DragAndDropOptions {
    onDrop: (files: FileList) => void;
}

export const useDragAndDrop = ({ onDrop }: DragAndDropOptions) => {
    useEffect(() => {
        const overlay = document.getElementById('drag-drop-overlay');
        if (!overlay) return;

        let counter = 0; // Counter to handle nested drag events

        const show = (e: DragEvent) => {
            e.preventDefault();
            if (counter === 0) {
                overlay.classList.remove('opacity-0');
                overlay.classList.add('opacity-100');
            }
            counter++;
        };

        const hide = () => {
            counter--;
            if (counter === 0) {
                overlay.classList.remove('opacity-100');
                overlay.classList.add('opacity-0');
            }
        };
        
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault(); // Necessary to allow drop
        };
        
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            counter = 0; // Reset counter on drop
            overlay.classList.remove('opacity-100');
            overlay.classList.add('opacity-0');

            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                onDrop(e.dataTransfer.files);
            }
        };
        
        window.addEventListener('dragenter', show);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', hide);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', show);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', hide);
            window.removeEventListener('drop', handleDrop);
        };
    }, [onDrop]);
};