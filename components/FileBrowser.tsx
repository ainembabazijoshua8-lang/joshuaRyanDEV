
import React from 'react';
import { FileItem, ViewMode, SortConfig, SortableField } from '../types';
import FileGridItem from './FileGridItem';
import FileListItem from './FileListItem';

interface FileBrowserProps {
    files: FileItem[];
    viewMode: ViewMode;
    selectedIds: Set<number>;
    onItemClick: (e: React.MouseEvent, id: number) => void;
    onItemDoubleClick: (file: FileItem) => void;
    onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
    sortConfig: SortConfig;
    setSortConfig: (config: SortConfig) => void;
}

const SortableHeader: React.FC<{
    field: SortableField;
    label: string;
    sortConfig: SortConfig;
    setSortConfig: (config: SortConfig) => void;
    className?: string;
}> = ({ field, label, sortConfig, setSortConfig, className }) => {
    const isCurrent = sortConfig.key === field;
    const directionIcon = sortConfig.direction === 'asc' ? '▲' : '▼';

    const handleSort = () => {
        const direction = isCurrent && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key: field, direction });
    };

    return (
        <div
            className={`cursor-pointer select-none flex items-center gap-1 ${className}`}
            onClick={handleSort}
        >
            {label}
            {isCurrent && <span className="text-xs">{directionIcon}</span>}
        </div>
    );
};

const FileBrowser: React.FC<FileBrowserProps> = ({ files, viewMode, selectedIds, onItemClick, onItemDoubleClick, onContextMenu, sortConfig, setSortConfig }) => {
    return (
        <div className="flex-grow overflow-y-auto pr-2">
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                    {files.map(file => (
                        <FileGridItem
                            key={file.id}
                            file={file}
                            isSelected={selectedIds.has(file.id)}
                            onClick={onItemClick}
                            onDoubleClick={onItemDoubleClick}
                            onContextMenu={onContextMenu}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-[1fr,150px,120px] gap-4 px-4 py-2 text-sm font-semibold text-text-secondary border-b border-border-color">
                        <SortableHeader field="name" label="Name" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                        <SortableHeader field="lastModified" label="Last Modified" sortConfig={sortConfig} setSortConfig={setSortConfig} className="justify-end"/>
                        <SortableHeader field="size" label="File Size" sortConfig={sortConfig} setSortConfig={setSortConfig} className="justify-end"/>
                    </div>
                    {files.map(file => (
                        <FileListItem
                            key={file.id}
                            file={file}
                            isSelected={selectedIds.has(file.id)}
                            onClick={onItemClick}
                            onDoubleClick={onItemDoubleClick}
                            onContextMenu={onContextMenu}
                        />
                    ))}
                </div>
            )}
             {files.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary">
                    <svg className="w-24 h-24 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
                    <h3 className="text-xl font-semibold text-text-primary">No files here</h3>
                    <p>Upload a file or create a new folder to get started.</p>
                </div>
            )}
        </div>
    );
};

export default FileBrowser;
