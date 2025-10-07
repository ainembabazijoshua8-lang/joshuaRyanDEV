
import React, { useState } from 'react';
import { FileItem, ClipboardState } from '../types';
import { ICONS } from '../constants';
import { getFileExtension, formatBytes, isImage, isEditable } from '../utils/fileUtils';
import FileNameEditor from './FileNameEditor';


interface FileListItemProps {
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
    // Fix: Added 'recents' to the location type to match the possible values from parent components.
    location: 'browser' | 'trash' | 'favorites' | 'recents';
    aiSnippet?: string;
    clipboard: ClipboardState | null;
}

const FileListItem: React.FC<FileListItemProps> = ({
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
    
    const icon = getIcon();

    return (
        <div
            className={`file-item grid grid-cols-12 gap-4 items-center px-4 py-2 rounded-lg cursor-pointer transition-all
                ${isSelected ? 'bg-primary-light' : isPreviewing ? 'bg-gray-200' : 'hover:bg-gray-100'}
                ${isDropTarget ? 'bg-blue-100' : ''}
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
            <div className="col-span-1">
                 {location !== 'trash' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(file.id); }}
                        aria-label={file.isFavorite ? `Remove ${file.name} from favorites` : `Add ${file.name} to favorites`}
                        className={`p-1 rounded-full z-10 ${file.isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                    >
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                )}
            </div>
            <div className="col-span-7 flex items-center gap-3">
                <div className="w-6 h-6 flex-shrink-0 text-gray-500">{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' }) : icon}</div>
                <div className="flex-grow truncate">
                    {isRenaming ? (
                        <FileNameEditor file={file} onRename={onRename} onCancel={() => setRenamingId(null)} className="w-full" />
                    ) : (
                        <span className="text-sm font-medium text-text-primary truncate" onClick={handleNameClick}>{file.name}</span>
                    )}
                    {aiSnippet && <p className="text-xs text-text-secondary mt-1 italic truncate">"...{aiSnippet}..."</p>}
                </div>
            </div>
            <div className="col-span-3 text-sm text-text-secondary">{new Date(file.lastModified).toLocaleDateString()}</div>
            <div className="col-span-2 text-sm text-text-secondary">{file.type === 'folder' ? '—' : formatBytes(file.size)}</div>
        </div>
    );
};

const MemoizedFileListItem = React.memo(FileListItem);

export default React.forwardRef<HTMLDivElement, Omit<FileListItemProps, 'ref'>>((props, ref) => (
    <div ref={ref}><MemoizedFileListItem {...props} /></div>
));
