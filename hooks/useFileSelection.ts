import { useState, useCallback } from 'react';
import { FileItem } from '../types.ts';

export const useFileSelection = (sortedFiles: FileItem[]) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [lastClickedId, setLastClickedId] = useState<number | null>(null);

    const handleItemClick = useCallback((e: React.MouseEvent, fileId: number) => {
        const newSelectedIds = new Set(selectedIds);
        if (e.shiftKey && lastClickedId !== null) {
            const lastIndex = sortedFiles.findIndex(f => f.id === lastClickedId);
            const currentIndex = sortedFiles.findIndex(f => f.id === fileId);
            
            // For shift-click, it's often better to start fresh unless ctrl/cmd is also held
            if (!e.ctrlKey && !e.metaKey) {
                newSelectedIds.clear();
            }

            // Safety check to prevent errors if an item was deleted or not found
            if (lastIndex > -1 && currentIndex > -1) {
                const [start, end] = [Math.min(lastIndex, currentIndex), Math.max(lastIndex, currentIndex)];
                for (let i = start; i <= end; i++) {
                    newSelectedIds.add(sortedFiles[i].id);
                }
            } else {
                 // Fallback to single-select if one of the items isn't found
                 newSelectedIds.add(fileId);
            }

        } else if (e.ctrlKey || e.metaKey) {
            if (newSelectedIds.has(fileId)) {
                newSelectedIds.delete(fileId);
            } else {
                newSelectedIds.add(fileId);
            }
        } else {
            if (newSelectedIds.has(fileId) && newSelectedIds.size === 1) {
                // Allows deselection if clicking the only selected item
                newSelectedIds.clear();
            } else {
                newSelectedIds.clear();
                newSelectedIds.add(fileId);
            }
        }
        setSelectedIds(newSelectedIds);
        setLastClickedId(fileId);
    }, [selectedIds, lastClickedId, sortedFiles]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setLastClickedId(null);
    }, []);

    return { selectedIds, setSelectedIds, lastClickedId, setLastClickedId, handleItemClick, clearSelection };
};
