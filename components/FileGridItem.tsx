import React from 'react';
import { FileItem, Location, ContextAction, ClipboardState } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { isImage } from '../utils/fileUtils.ts';
import FileNameEditor from './FileNameEditor.tsx';

interface FileGridItemProps {
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

const FileGridItem: React.FC<FileGridItemProps> = (props) => {
    const { file, isSelected, isEditing, onClick, onDoubleClick, onContextMenu, onRename, setEditingId, setRef, onDrop, isDraggable, aiSnippet, isPreviewing, allFiles } = props;

    const isCut = props.clipboard?.action === 'cut' && props.clipboard.fileIds.has(file.id);

    const handleDragStart = (e: React.DragEvent) => {
        if (!isSelected) {
            // If dragging an unselected item, select it first
            onClick(e as unknown as React.MouseEvent, file.id);
        }
        e.dataTransfer.setData('application/cloudflow-items', 'true');
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            ref={setRef}
            className={`group relative flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors ${
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
            <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                {isImage(file.name) && file.url ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded-md" />
                ) : (
                    <div className="w-full h-full">{file.type === 'folder' ? ICONS.folder : ICONS.file}</div>
                )}
            </div>
            {isEditing ? (
                <FileNameEditor file={file} onRename={onRename} onCancel={() => setEditingId(null)} className="text-center" allFiles={allFiles} />
            ) : (
                <span className="text-sm font-medium text-text-primary text-center break-words w-full truncate" title={file.name}>
                    {file.name}
                </span>
            )}
            {aiSnippet && (
                 <p className="text-xs text-gray-500 mt-1 text-center overflow-hidden max-h-10">
                    <span className="font-semibold text-purple-600">AI:</span> "{aiSnippet}"
                </p>
            )}
        </div>
    );
};

export default FileGridItem;