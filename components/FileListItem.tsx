
import React from 'react';
import { FileItem } from '../types';
import { getFileIcon, formatBytes } from '../utils/fileUtils';

interface FileListItemProps {
    file: FileItem;
    isSelected: boolean;
    onClick: (e: React.MouseEvent, id: number) => void;
    onDoubleClick: (file: FileItem) => void;
    onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ file, isSelected, onClick, onDoubleClick, onContextMenu }) => {
    return (
        <div
            className={`file-item grid grid-cols-[40px,1fr,150px,120px] items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected ? 'bg-primary-light' : 'hover:bg-gray-100'
            }`}
            onClick={(e) => onClick(e, file.id)}
            onDoubleClick={() => onDoubleClick(file)}
            onContextMenu={(e) => onContextMenu(e, file)}
        >
            <div className="flex items-center justify-center">
                {getFileIcon(file.name, file.type, 'h-6 w-6')}
            </div>
            <div className="font-medium text-text-primary truncate" title={file.name}>
                {file.name}
            </div>
            <div className="text-sm text-text-secondary text-right">
                {new Date(file.lastModified).toLocaleDateString()}
            </div>
            <div className="text-sm text-text-secondary text-right">
                {file.type !== 'folder' && formatBytes(file.size)}
            </div>
        </div>
    );
};

export default FileListItem;
