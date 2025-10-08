import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileItem, SortConfig, SortableField, SortDirection } from '../types.ts';

export const useFiles = (initialFiles: FileItem[]) => {
    const [files, setFiles] = useState<FileItem[]>(() => {
        try {
            const localData = localStorage.getItem('cloudFilesV5');
            return localData ? JSON.parse(localData) : initialFiles;
        } catch (error) {
            console.error("Failed to parse files from localStorage", error);
            return initialFiles;
        }
    });

    const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
        try {
            const localConfig = localStorage.getItem('cloudSortConfigV1');
            return localConfig ? JSON.parse(localConfig) : { key: 'name', direction: 'asc' };
        } catch (error) {
            console.error("Failed to parse sort config from localStorage", error);
            return { key: 'name', direction: 'asc' };
        }
    });

    useEffect(() => {
        localStorage.setItem('cloudFilesV5', JSON.stringify(files));
    }, [files]);

    useEffect(() => {
        localStorage.setItem('cloudSortConfigV1', JSON.stringify(sortConfig));
    }, [sortConfig]);
    
    const sortedFiles = useMemo(() => {
        const sortableFiles = [...files];
        sortableFiles.sort((a, b) => {
            // Folders always on top
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            const key = sortConfig.key;
            const valA = a[key as keyof FileItem];
            const valB = b[key as keyof FileItem];

            let comparison = 0;
            
            // Handle null/undefined values, sorting them to the bottom
            if (valA == null && valB != null) comparison = 1;
            else if (valA != null && valB == null) comparison = -1;
            else if (valA == null && valB == null) comparison = 0;
            else if (typeof valA === 'string' && typeof valB === 'string') {
                comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
            } else {
                 // @ts-ignore
                if (valA < valB) comparison = -1;
                 // @ts-ignore
                if (valA > valB) comparison = 1;
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
        return sortableFiles;
    }, [files, sortConfig]);

    return { files, setFiles, sortConfig, setSortConfig, sortedFiles };
};
