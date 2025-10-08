import React, { useRef, useMemo, useCallback } from 'react';
import { FileItem, ViewMode, SortConfig, SortableField, Location, ContextAction, ClipboardState, AiSearchResult } from '../types.ts';
import FileGridItem from './FileGridItem.tsx';
import FileListItem from './FileListItem.tsx';
import { ICONS } from '../constants.tsx';
import ContextMenu, { useContextMenu } from './ContextMenu.tsx';
import { useMarqueeSelection } from '../hooks/useMarqueeSelection.ts';
import Breadcrumbs from './Breadcrumbs.tsx';

interface FileBrowserProps {
    files: FileItem[];
    allFiles: FileItem[];
    currentFolderId: number | null;
    location: Location;
    viewMode: ViewMode;
    selectedIds: Set<number>;
    editingId: number | null;
    sortConfig: SortConfig;
    onItemClick: (e: React.MouseEvent, fileId: number) => void;
    onItemDoubleClick: (file: FileItem) => void;
    onRename: (fileId: number, newName: string) => void;
    setEditingId: (id: number | null) => void;
    onNavigate: (folderId: number | null) => void;
    onMove: (draggedIds: Set<number>, targetFolderId: number | null) => void;
    onSortChange: (config: SortConfig) => void;
    clearSelection: () => void;
    setSelectedIds: (ids: Set<number>) => void;
    onAction: (action: ContextAction, fileId: number | null) => void;
    clipboard: ClipboardState | null;
    aiSearchResults: AiSearchResult[] | null;
    previewingFileId: number | null;
}

const FileBrowser: React.FC<FileBrowserProps> = (props) => {
    const {
        files, viewMode, selectedIds, editingId, sortConfig,
        onItemClick, onItemDoubleClick, onRename, setEditingId,
        onSortChange, onNavigate, currentFolderId, location,
        clearSelection, setSelectedIds, allFiles, onAction, clipboard,
        aiSearchResults, previewingFileId, onMove
    } = props;
    
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef(new Map<number, HTMLElement>());
    const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

    const { MarqueeComponent, handleMouseDown, handleMouseMove, handleMouseUp } = useMarqueeSelection({
        itemRefs,
        containerRef,
        allItems: files,
        selectedIds,
        setSelectedIds,
        clearSelection,
    });
    
    const SortableHeader: React.FC<{ field: SortableField, label: string }> = ({ field, label }) => {
        const isCurrentKey = sortConfig.key === field;
        const directionIcon = isCurrentKey ? (sortConfig.direction === 'asc' ? ICONS.arrowUp : ICONS.arrowDown) : null;
        const handleSort = () => {
            const direction = isCurrentKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
            onSortChange({ key: field, direction });
        };
        return (
            <button className="flex items-center font-semibold text-text-secondary hover:text-text-primary" onClick={handleSort}>
                {label} {directionIcon}
            </button>
        );
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        if (e.target === containerRef.current) {
            clearSelection();
        }
        closeContextMenu();
    };
    
    const handleDrop = (targetFileId: number | null) => {
        if (selectedIds.size === 0) return;
        
        let targetFolderId: number | null = null;
        if (targetFileId !== null) {
            const targetFile = allFiles.find(f => f.id === targetFileId);
            if (targetFile?.type === 'folder') {
                targetFolderId = targetFile.id;
            } else {
                targetFolderId = targetFile?.parentId ?? null;
            }
        } else {
            targetFolderId = currentFolderId;
        }

        // Prevent dropping a folder into itself
        if (targetFolderId !== null && selectedIds.has(targetFolderId)) return;

        onMove(selectedIds, targetFolderId);
    };

    const memoizedFiles = useMemo(() => files.map(file => {
        const ItemComponent = viewMode === 'grid' ? FileGridItem : FileListItem;
        const aiSnippet = aiSearchResults?.find(r => r.id === file.id)?.snippet;
        const isDraggable = selectedIds.size > 0 && selectedIds.has(file.id);

        return (
             <ItemComponent
                key={file.id}
                file={file}
                isSelected={selectedIds.has(file.id)}
                isEditing={editingId === file.id}
                onClick={onItemClick}
                onDoubleClick={onItemDoubleClick}
                onContextMenu={handleContextMenu}
                onRename={onRename}
                setEditingId={setEditingId}
                setRef={(el) => {
                    if (el) itemRefs.current.set(file.id, el);
                    else itemRefs.current.delete(file.id);
                }}
                onDrop={handleDrop}
                isDraggable={isDraggable}
                location={location}
                clipboard={clipboard}
                onAction={onAction}
                aiSnippet={aiSnippet}
                isPreviewing={previewingFileId === file.id}
                allFiles={allFiles}
            />
        );
    }), [files, viewMode, selectedIds, editingId, onItemClick, onItemDoubleClick, handleContextMenu, onRename, setEditingId, location, clipboard, onAction, aiSearchResults, previewingFileId, onMove, selectedIds, allFiles]);

    const GridWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6 pt-4">
            {children}
        </div>
    );

    const ListWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
        <div>
            <div className="grid grid-cols-[minmax(0,3fr)_1fr_2fr_2fr] gap-4 px-4 pb-2 border-b border-border-color sticky top-0 bg-white z-10">
                <SortableHeader field="name" label="Name" />
                <SortableHeader field="size" label="Size" />
                {location === 'trash' ? (
                    <>
                        <SortableHeader field="trashedOn" label="Date Trashed" />
                        <span/>
                    </>
                ) : (
                    <>
                        <SortableHeader field="lastModified" label="Last Modified" />
                        <SortableHeader field="lastOpened" label="Last Opened" />
                    </>
                )}
            </div>
            <div className="space-y-1 mt-2">{children}</div>
        </div>
    );
    
    const Wrapper = viewMode === 'grid' ? GridWrapper : ListWrapper;

    const getTitle = () => {
        switch(location) {
            case 'trash': return 'Trash';
            case 'favorites': return 'Favorites';
            case 'recents': return 'Recent Files';
            default: return null;
        }
    };
    const title = getTitle();

    return (
        <div className="flex-1 flex flex-col overflow-auto"
            onDrop={(e) => { e.preventDefault(); handleDrop(null); }}
            onDragOver={e => e.preventDefault()}
        >
            {location === 'browser' && <Breadcrumbs currentFolderId={currentFolderId} files={allFiles} onNavigate={onNavigate} />}
            {title && <h2 className="text-xl font-semibold text-text-primary mb-4">{title}</h2>}
            <div className="flex-1 overflow-auto"
                ref={containerRef}
                onClick={handleContainerClick}
                onContextMenu={(e) => {
                    if(e.target === containerRef.current) {
                        handleContextMenu(e, null)
                    }
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {files.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-text-secondary">
                        <p>This space is empty.</p>
                    </div>
                ) : (
                    <Wrapper>{memoizedFiles}</Wrapper>
                )}
                {contextMenu && <ContextMenu {...contextMenu} {...props} onClose={closeContextMenu} />}
                {MarqueeComponent}
            </div>
        </div>
    );
};

export default FileBrowser;