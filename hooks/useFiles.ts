
import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileItem, SortConfig, SortableField, SortDirection } from '../types';

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

            let comparison = 0;
            if (a[sortConfig.key] < b[sortConfig.key]) {
                comparison = -1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                comparison = 1;
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
        return sortableFiles;
    }, [files, sortConfig]);

    return { files, setFiles, sortConfig, setSortConfig, sortedFiles };
};