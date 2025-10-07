
import React from 'react';
import { FileItem } from '../types';
import { getFileIcon } from '../utils/fileUtils';

interface FileGridItemProps {
    file: FileItem;
    isSelected: boolean;
    onClick: (e: React.MouseEvent, id: number) => void;
    onDoubleClick: (file: FileItem) => void;
    onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
}

const FileGridItem: React.FC<FileGridItemProps> = ({ file, isSelected, onClick, onDoubleClick, onContextMenu }) => {
    return (
        <div
            className={`file-item group relative flex flex-col items-center p-4 text-center rounded-xl cursor-pointer transition-all duration-200 ease-in-out ${
                isSelected ? 'bg-primary-light border-2 border-primary' : 'bg-white hover:bg-gray-50 border-2 border-transparent'
            }`}
            onClick={(e) => onClick(e, file.id)}
            onDoubleClick={() => onDoubleClick(file)}
            onContextMenu={(e) => onContextMenu(e, file)}
        >
            <div className="mb-2">
                {getFileIcon(file.name, file.type, 'h-16 w-16')}
            </div>
            <p className="text-sm font-medium text-text-primary break-all">
                {file.name}
            </p>
        </div>
    );
};

export default FileGridItem;
