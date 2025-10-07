
import React, { useState, useEffect, useCallback } from 'react';
import { FileItem, ViewMode, ModalState, ContextMenuState, SortableField, SortDirection } from './types';
import { initialFiles } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FileBrowser from './components/FileBrowser';
import ContextMenu from './components/ContextMenu';
import ModalRenderer from './components/modals/ModalRenderer';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useFileSelection } from './hooks/useFileSelection';
import { useFiles } from './hooks/useFiles';

const App: React.FC = () => {
    const { files, setFiles, sortConfig, setSortConfig, sortedFiles } = useFiles(initialFiles);
    const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('cloudViewMode') as ViewMode) || 'grid');
    const [modal, setModal] = useState<ModalState>({ type: null });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const { selectedIds, setSelectedIds, lastClickedId, setLastClickedId, handleItemClick, clearSelection } = useFileSelection(sortedFiles);

    useDragAndDrop();

    useEffect(() => {
        localStorage.setItem('cloudViewMode', viewMode);
    }, [viewMode]);

    const handleContextMenu = useCallback((e: React.MouseEvent, file: FileItem) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedIds.has(file.id)) {
            setSelectedIds(new Set([file.id]));
        }
        setContextMenu({ x: e.pageX, y: e.pageY, file });
    }, [selectedIds, setSelectedIds]);

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    const handleGlobalClick = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.file-item, .context-menu')) {
            clearSelection();
        }
        closeContextMenu();
    }, [clearSelection, closeContextMenu]);

    useEffect(() => {
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, [handleGlobalClick]);


    return (
        <div className="flex h-screen bg-background-light font-sans text-text-primary overflow-hidden">
            <Sidebar />
            <main className="flex-grow flex flex-col p-8 overflow-hidden">
                <Header
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedCount={selectedIds.size}
                    onNewFolder={() => setModal({ type: 'new-folder' })}
                    onUpload={() => setModal({ type: 'upload' })}
                    onDelete={() => setModal({ type: 'confirm-delete', count: selectedIds.size })}
                />
                <FileBrowser
                    files={sortedFiles}
                    viewMode={viewMode}
                    selectedIds={selectedIds}
                    onItemClick={handleItemClick}
                    onItemDoubleClick={(file) => setModal({ type: 'view', file })}
                    onContextMenu={handleContextMenu}
                    sortConfig={sortConfig}
                    setSortConfig={setSortConfig}
                />
            </main>
            {contextMenu && (
                <ContextMenu
                    menu={contextMenu}
                    onClose={closeContextMenu}
                    setModal={setModal}
                />
            )}
            <ModalRenderer
                modal={modal}
                setModal={setModal}
                files={files}
                setFiles={setFiles}
                selectedIds={selectedIds}
                clearSelection={clearSelection}
            />
        </div>
    );
};

export default App;
