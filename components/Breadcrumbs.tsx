import React, { useMemo } from 'react';
import { FileItem } from '../types.ts';

interface BreadcrumbsProps {
    currentFolderId: number | null;
    files: FileItem[];
    onNavigate: (folderId: number | null) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentFolderId, files, onNavigate }) => {
    const path = useMemo(() => {
        const breadcrumbPath: FileItem[] = [];
        let currentId = currentFolderId;

        while (currentId !== null) {
            const folder = files.find(f => f.id === currentId);
            if (folder && folder.type === 'folder') {
                breadcrumbPath.unshift(folder);
                currentId = folder.parentId;
            } else {
                // Invalid path or file found, stop tracing
                break;
            }
        }
        return breadcrumbPath;
    }, [currentFolderId, files]);

    return (
        <nav className="mb-4 flex items-center text-sm text-text-secondary" aria-label="Breadcrumb">
            <button onClick={() => onNavigate(null)} className="hover:text-primary transition-colors">Home</button>
            {path.map((folder, index) => (
                <React.Fragment key={folder.id}>
                    <span className="mx-2 select-none">/</span>
                    {index === path.length - 1 ? (
                        <span className="font-semibold text-text-primary">{folder.name}</span>
                    ) : (
                        <button onClick={() => onNavigate(folder.id)} className="hover:text-primary transition-colors">{folder.name}</button>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumbs;