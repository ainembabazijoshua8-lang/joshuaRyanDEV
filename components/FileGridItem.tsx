
import React, { useState } from 'react';
import { FileItem, ClipboardState } from '../types';
import { ICONS } from '../constants';
import { getFileExtension, formatBytes, isImage, isEditable } from '../utils/fileUtils';
import FileNameEditor from './FileNameEditor';

interface FileGridItemProps {
    file: FileItem;
    isSelected: boolean;
    isRenaming: boolean;
    isPreviewing: boolean;
    onClick: (e: React.MouseEvent) => void;
    onDoubleClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onRename: (fileId: number, newName: string) => void;
    setRenamingId: (id: number | null) => void;
    onDrop: (e: React.DragEvent, targetFolderId: number | null) => void;
    selectedIds: Set<number>;
    onToggleFavorite: (id: number) => void;
    location: 'browser' | 'trash' | 'favorites';
    aiSnippet?: string;
    clipboard: ClipboardState | null;
}

const FileGridItem: React.FC<FileGridItemProps> = ({ 
    file, isSelected, isRenaming, isPreviewing, onClick, onDoubleClick, onContextMenu, 
    onRename, setRenamingId, onDrop, selectedIds, onToggleFavorite, location, aiSnippet,
    clipboard
}) => {
    const [isDropTarget, setIsDropTarget] = useState(false);
    const isCut = clipboard?.action === 'cut' && clipboard.fileIds.has(file.id);

    const getIcon = () => {
        if (file.type === 'folder') return ICONS.folder;
        if (isImage(file.name)) return ICONS.image;
        if (getFileExtension(file.name) === 'pdf') return ICONS.pdf;
        if (isEditable(file.name)) return ICONS.text;
        return ICONS.file;
    };
    
    const handleDragStart = (e: React.DragEvent) => {
        if (isRenaming) return e.preventDefault();
        const dragData = isSelected ? Array.from(selectedIds) : [file.id];
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (file.type === 'folder' && location === 'browser') setIsDropTarget(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDropTarget(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDropTarget(false);
        if (file.type === 'folder' && location === 'browser') onDrop(e, file.id);
    };

    const handleNameClick = (e: React.MouseEvent) => {
        if (isSelected && !isRenaming && location !== 'trash') {
            e.stopPropagation();
            setRenamingId(file.id);
        }
    };

    return (
        <div
            className={`file-item relative group flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all
                ${isSelected ? 'bg-primary-light border border-primary' : isPreviewing ? 'bg-gray-200' : 'hover:bg-gray-100'}
                ${isDropTarget ? 'ring-2 ring-primary ring-inset' : ''}
                ${isCut ? 'opacity-50' : ''}
            `}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            draggable={location !== 'trash' && !isRenaming}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
             {location !== 'trash' && (
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(file.id); }}
                    aria-label={file.isFavorite ? `Remove ${file.name} from favorites` : `Add ${file.name} to favorites`}
                    className={`absolute top-1 right-1 p-1 rounded-full z-10 
                        ${file.isFavorite ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </button>
            )}
            <div className="relative w-20 h-20 flex items-center justify-center">
                {getIcon()}
            </div>
            
            <div className="w-full text-center mt-2">
                 {isRenaming ? (
                    <FileNameEditor file={file} onRename={onRename} onCancel={() => setRenamingId(null)} />
                 ) : (
                    <p className="text-sm font-medium text-text-primary truncate" onClick={handleNameClick}>{file.name}</p>
                 )}
                 {aiSnippet ? (
                     <p className="text-xs text-text-secondary mt-1 italic truncate">"...{aiSnippet}..."</p>
                 ) : (
                    <p className="text-xs text-text-secondary">
                        {file.type === 'folder' ? '—' : formatBytes(file.size)}
                    </p>
                 )}
            </div>
        </div>
    );
};

const MemoizedFileGridItem = React.memo(FileGridItem);

export default React.forwardRef<HTMLDivElement, Omit<FileGridItemProps, 'ref'>>((props, ref) => (
    <div ref={ref}><MemoizedFileGridItem {...props} /></div>
));
