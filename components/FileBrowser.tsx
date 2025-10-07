
import React, { useRef, useMemo } from 'react';
import { FileItem, ViewMode, SortConfig, AiSearchResult, SearchMode, ClipboardState } from '../types';
import FileGridItem from './FileGridItem';
import FileListItem from './FileListItem';
import Breadcrumbs from './Breadcrumbs';
import { useMarqueeSelection } from '../hooks/useMarqueeSelection';
import { isDroppingInChild } from '../utils/fileUtils';
import { ICONS } from '../constants';

interface FileBrowserProps {
    files: FileItem[];
    allFiles: FileItem[];
    viewMode: ViewMode;
    onItemClick: (e: React.MouseEvent, fileId: number) => void;
    onItemDoubleClick: (file: FileItem) => void;
    onContextMenu: (e: React.MouseEvent, file: FileItem | null) => void;
    selectedIds: Set<number>;
    setSelectedIds: (ids: Set<number>) => void;
    clearSelection: () => void;
    onNavigate: (folderId: number | null) => void;
    currentFolderId: number | null;
    sortConfig: SortConfig;
    setSortConfig: (config: SortConfig) => void;
    onMoveFiles: (draggedIds: Set<number>, targetFolderId: number | null) => void;
    renamingId: number | null;
    setRenamingId: (id: number | null) => void;
    onRename: (fileId: number, newName: string) => void;
    onToggleFavorite: (id: number) => void;
    location: 'browser' | 'trash' | 'favorites' | 'recents';
    searchTerm: string;
    searchMode: SearchMode;
    aiSearchResults: AiSearchResult[];
    previewingFileId: number | null;
    clipboard: ClipboardState | null;
}

const FileBrowser: React.FC<FileBrowserProps> = ({
    files, allFiles, viewMode, onItemClick, onItemDoubleClick, onContextMenu,
    selectedIds, setSelectedIds, clearSelection, onNavigate, currentFolderId,
    sortConfig, setSortConfig, onMoveFiles, renamingId, setRenamingId, onRename,
    onToggleFavorite, location, searchTerm, searchMode, aiSearchResults, previewingFileId,
    clipboard
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef(new Map<number, HTMLElement>());
    
    const { MarqueeComponent, handleMouseDown, handleMouseMove, handleMouseUp } = useMarqueeSelection({
        itemRefs, containerRef, allItems: files, selectedIds, setSelectedIds, clearSelection
    });

    const aiSnippets = useMemo(() => {
        return new Map(aiSearchResults.map(result => [result.id, result.snippet]));
    }, [aiSearchResults]);

    const handleDrop = (e: React.DragEvent, targetFolderId: number | null) => {
        e.preventDefault(); e.stopPropagation();
        const draggedIdsStr = e.dataTransfer.getData('application/json');
        if (!draggedIdsStr) return;

        const draggedIds = new Set<number>(JSON.parse(draggedIdsStr));
        
        if (targetFolderId !== null && isDroppingInChild(draggedIds, targetFolderId, allFiles)) {
            alert("You cannot move a folder into one of its own subfolders.");
            return;
        }
        if (targetFolderId !== null && draggedIds.has(targetFolderId)) return;
        if (location !== 'browser') return; // Prevent moving from trash/favorites

        onMoveFiles(draggedIds, targetFolderId);
    };
    
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

    const handleSort = (key: SortConfig['key']) => {
        let direction: SortConfig['direction'] = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const renderHeader = () => {
        if (viewMode === 'grid' || location === 'recents') return null;
        
        const renderSortArrow = (key: SortConfig['key']) => {
            if (sortConfig.key !== key) return null;
            return sortConfig.direction === 'asc' ? ICONS.arrowUp : ICONS.arrowDown;
        };
        
        const headers: { key: SortConfig['key'], label: string, span: string }[] = [
            { key: 'name', label: 'Name', span: 'col-span-7' },
            { key: 'lastModified', label: location === 'trash' ? 'Date Trashed' : 'Last Modified', span: 'col-span-3' },
            { key: 'size', label: 'File Size', span: 'col-span-2' },
        ];
        
        return (
            <div className="grid grid-cols-12 gap-4 px-4 py-2 font-semibold text-sm text-text-secondary border-b sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                <div className="col-span-1"></div>
                {headers.map(h => (
                    <div key={h.key} className={`${h.span} cursor-pointer hover:text-text-primary`} onClick={() => handleSort(h.key)}>
                        {h.label} {renderSortArrow(h.key)}
                    </div>
                ))}
            </div>
        );
    }

    const renderEmptyState = () => {
        let message = "This folder is empty.";
        let suggestion = "Drag and drop files here to upload, or right-click to create a new folder.";

        if (searchTerm) {
            message = "No results found.";
            suggestion = `Try a different search term or switch to an AI content search.`;
        } else if (location === 'favorites') {
            message = "No favorites yet.";
            suggestion = "Click the star icon on any file or folder to add it here.";
        } else if (location === 'trash') {
            message = "The trash is empty.";
            suggestion = "Deleted files will appear here.";
        } else if (location === 'recents') {
            message = "No recent files.";
            suggestion = "Open or preview a file to have it show up here.";
        }


        return (
            <div className="text-center text-text-secondary py-20">
                <p className="font-semibold">{message}</p>
                <p className="text-sm">{suggestion}</p>
            </div>
        );
    };

    const renderFiles = () => {
        if (files.length === 0) return renderEmptyState();

        const ItemComponent = viewMode === 'grid' ? FileGridItem : FileListItem;

        const items = files.map(file => (
            <div key={file.id} ref={el => {
                if (el) {
                    itemRefs.current.set(file.id, el)
                } else {
                    itemRefs.current.delete(file.id)
                }
            }}>
                <ItemComponent
                    file={file}
                    isSelected={selectedIds.has(file.id)}
                    isRenaming={renamingId === file.id}
                    isPreviewing={previewingFileId === file.id}
                    onClick={(e) => onItemClick(e, file.id)}
                    onDoubleClick={() => onItemDoubleClick(file)}
                    onContextMenu={(e) => onContextMenu(e, file)}
                    onRename={onRename}
                    setRenamingId={setRenamingId}
                    onDrop={handleDrop}
                    selectedIds={selectedIds}
                    onToggleFavorite={onToggleFavorite}
                    location={location}
                    aiSnippet={searchMode === 'content' ? aiSnippets.get(file.id) : undefined}
                    clipboard={clipboard}
                />
            </div>
        ));
        
        if (viewMode === 'grid') return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">{items}</div>;
        return <div className="space-y-1">{items}</div>;
    };

    const showBreadcrumbs = location === 'browser' && !searchTerm;

    return (
        <div 
            ref={containerRef}
            className="flex-1 p-4 overflow-y-auto" 
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp}
            onDrop={(e) => handleDrop(e, currentFolderId)}
            onDragOver={handleDragOver}
            onContextMenu={(e) => onContextMenu(e, null)}
        >
            {showBreadcrumbs && <Breadcrumbs currentFolderId={currentFolderId} files={allFiles} onNavigate={onNavigate} />}
            {renderHeader()}
            {renderFiles()}
            {MarqueeComponent}
        </div>
    );
};

export default FileBrowser;
