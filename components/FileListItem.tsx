import React from 'react';
import { FileItem, Location, ContextAction, ClipboardState } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { formatBytes, isImage } from '../utils/fileUtils.ts';
import FileNameEditor from './FileNameEditor.tsx';

interface FileListItemProps {
    file: FileItem;
    allFiles: FileItem[];
    isSelected: boolean;
    isEditing: boolean;
    onClick: (e: React.MouseEvent, fileId: number) => void;
    onDoubleClick: (file: FileItem) => void;
    onContextMenu: (e: React.MouseEvent, fileId: number) => void;
    onRename: (fileId: number, newName: string) => void;
    setEditingId: (id: number | null) => void;
    setRef: (el: HTMLElement | null) => void;
    onDrop: (targetFileId: number) => void;
    isDraggable: boolean;
    location: Location;
    clipboard: ClipboardState | null;
    onAction: (action: ContextAction, fileId: number | null) => void;
    aiSnippet?: string;
    isPreviewing: boolean;
}

const FileListItem: React.FC<FileListItemProps> = (props) => {
    const { file, isSelected, isEditing, onClick, onDoubleClick, onContextMenu, onRename, setEditingId, setRef, onDrop, isDraggable, location, aiSnippet, isPreviewing, allFiles } = props;

    const isCut = props.clipboard?.action === 'cut' && props.clipboard.fileIds.has(file.id);
    
    const handleDragStart = (e: React.DragEvent) => {
        if (!isSelected) {
            onClick(e as unknown as React.MouseEvent, file.id);
        }
        e.dataTransfer.setData('application/cloudflow-items', 'true');
        e.dataTransfer.effectAllowed = 'move';
    };

    const FileIcon: React.FC = () => (
        <div className="w-8 h-8 flex-shrink-0 mr-4 flex items-center justify-center">
             {isImage(file.name) && file.url ? (
                <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded" />
            ) : (
                <div className="w-6 h-6">{file.type === 'folder' ? ICONS.folder : ICONS.file}</div>
            )}
        </div>
    );

    return (
        <div
            ref={setRef}
            className={`grid grid-cols-[minmax(0,3fr)_1fr_2fr_2fr] items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                 isPreviewing ? 'bg-blue-200' : isSelected ? 'bg-primary-light' : 'hover:bg-gray-100'
            } ${isCut ? 'opacity-50' : ''}`}
            onClick={(e) => onClick(e, file.id)}
            onDoubleClick={() => onDoubleClick(file)}
            onContextMenu={(e) => onContextMenu(e, file.id)}
            onDragOver={e => {
                if (file.type === 'folder') {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-blue-200');
                }
            }}
            onDragLeave={e => e.currentTarget.classList.remove('bg-blue-200')}
            onDrop={e => {
                if (file.type === 'folder') {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('bg-blue-200');
                    onDrop(file.id);
                }
            }}
            draggable={isDraggable}
            onDragStart={handleDragStart}
        >
            <div className="flex items-center truncate">
                <FileIcon />
                <div className="flex-1 truncate">
                    {isEditing ? (
                         <FileNameEditor file={file} onRename={onRename} onCancel={() => setEditingId(null)} allFiles={allFiles} />
                    ) : (
                        <p className="font-medium text-text-primary truncate" title={file.name}>{file.name}</p>
                    )}
                    {aiSnippet && (
                         <p className="text-xs text-gray-500 mt-1 truncate">
                            <span className="font-semibold text-purple-600">AI:</span> "{aiSnippet}"
                        </p>
                    )}
                </div>
            </div>
            <div className="text-sm text-text-secondary truncate">{file.type === 'folder' ? '—' : formatBytes(file.size)}</div>
            {location === 'trash' ? (
                <>
                    <div className="text-sm text-text-secondary truncate">{file.trashedOn ? new Date(file.trashedOn).toLocaleDateString() : '—'}</div>
                    <div/>
                </>
            ) : (
                 <>
                    <div className="text-sm text-text-secondary truncate">{new Date(file.lastModified).toLocaleDateString()}</div>
                    <div className="text-sm text-text-secondary truncate">{file.lastOpened ? new Date(file.lastOpened).toLocaleDateString() : '—'}</div>
                </>
            )}
        </div>
    );
};

export default FileListItem;