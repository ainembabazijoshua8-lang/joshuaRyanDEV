
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FileItem, ViewMode, ModalState, ContextMenuState, SearchMode, AiSearchResult, ClipboardState } from './types';
import { initialFiles } from './constants';
import { useFiles } from './hooks/useFiles';
import { useFileSelection } from './hooks/useFileSelection';
import { findRestorationParent, processFilesForUpload, isEditable, duplicateFiles } from './utils/fileUtils';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { performAiSearch } from './services/geminiService';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FileBrowser from './components/FileBrowser';
import ModalRenderer from './components/modals/ModalRenderer';
import ContextMenu from './components/ContextMenu';
import PreviewSidebar from './components/PreviewSidebar';


function App() {
    const { files, setFiles, sortedFiles: allSortedFiles, sortConfig, setSortConfig } = useFiles(initialFiles);
    const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('cloudViewModeV1') as ViewMode) || 'grid');
    const [modal, setModal] = useState<ModalState>({ type: null });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('filename');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiSearchResults, setAiSearchResults] = useState<AiSearchResult[]>([]);
    const [location, setLocation] = useState<'browser' | 'trash' | 'favorites'>('browser');
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [previewingFileId, setPreviewingFileId] = useState<number | null>(null);
    const [clipboard, setClipboard] = useState<ClipboardState | null>(null);

    // AI Search Effect
    useEffect(() => {
        if (searchMode === 'content' && searchTerm.trim().length > 2) {
            const handleAiSearch = async () => {
                setIsAiSearching(true);
                const filesToSearch = allSortedFiles
                    .filter(f => !f.isTrashed && isEditable(f.name) && f.versions && f.versions.length > 0)
                    .map(f => ({ id: f.id, content: f.versions![0].content }));
                
                const results = await performAiSearch(searchTerm, filesToSearch);
                setAiSearchResults(results);
                setIsAiSearching(false);
            };
            // Debounce
            const timer = setTimeout(handleAiSearch, 500);
            return () => clearTimeout(timer);
        } else {
            setAiSearchResults([]);
        }
    }, [searchTerm, searchMode, allSortedFiles]);
    
    const displayedFiles = useMemo(() => {
        let baseFiles = allSortedFiles;

        if (searchMode === 'content' && searchTerm) {
            const resultMap = new Set(aiSearchResults.map(r => r.id));
            baseFiles = allSortedFiles.filter(f => resultMap.has(f.id));
        } else {
            switch (location) {
                case 'browser':
                    baseFiles = baseFiles.filter(f => !f.isTrashed && f.parentId === currentFolderId);
                    break;
                case 'trash':
                    baseFiles = baseFiles.filter(f => f.isTrashed);
                    break;
                case 'favorites':
                    baseFiles = baseFiles.filter(f => !f.isTrashed && f.isFavorite);
                    break;
            }
    
            if (searchTerm) {
                baseFiles = baseFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
            }
        }

        return baseFiles;
    }, [allSortedFiles, location, currentFolderId, searchTerm, searchMode, aiSearchResults]);

    const { selectedIds, setSelectedIds, handleItemClick, clearSelection } = useFileSelection(displayedFiles);
     useEffect(() => {
        localStorage.setItem('cloudViewModeV1', viewMode);
    }, [viewMode]);

    const handleUpload = useCallback(async (uploadedFileList: FileList) => {
        const uploadModal: ModalState = { type: 'upload', currentFolderId };
        setModal(uploadModal);
        const newFiles = await processFilesForUpload(uploadedFileList, currentFolderId);
        setFiles(prev => [...newFiles, ...prev]);
    }, [setFiles, currentFolderId]);

    useDragAndDrop({ onDrop: handleUpload });

    const handleOpen = (file: FileItem) => {
        if (file.type === 'folder') {
            setCurrentFolderId(file.id);
            setLocation('browser');
            setSearchTerm('');
            clearSelection();
        } else {
            const editorModal: ModalState = { type: 'view', file };
            setModal(editorModal);
        }
    };
    
    const handleRename = (fileId: number, newName: string) => {
        setFiles(files.map(f => f.id === fileId ? { ...f, name: newName, lastModified: Date.now() } : f));
        setRenamingId(null);
    };

    const handleTrash = (idsToTrash: Set<number>) => {
        const now = Date.now();
        setFiles(files.map(f => idsToTrash.has(f.id) ? { ...f, isTrashed: true, trashedOn: now, isFavorite: false } : f));
        clearSelection();
    };

    const handleRestore = (idsToRestore: Set<number>) => {
        setFiles(files.map(f => {
            if (idsToRestore.has(f.id)) {
                return { 
                    ...f, 
                    isTrashed: false, 
                    trashedOn: undefined,
                    parentId: findRestorationParent(f, files),
                };
            }
            return f;
        }));
        clearSelection();
    };
    const getDescendantIds = (fileId: number, allFiles: FileItem[]): Set<number> => {
        const children = allFiles.filter(f => f.parentId === fileId);
        let descendantIds = new Set(children.map(c => c.id));
        for (const child of children) {
            if (child.type === 'folder') {
                const nestedIds = getDescendantIds(child.id, allFiles);
                nestedIds.forEach(id => descendantIds.add(id));
            }
        }
        return descendantIds;
    };
    const handlePermanentDelete = (ids: Set<number>) => {
        let allIdsToDelete = new Set(ids);
        ids.forEach(id => {
            const file = files.find(f => f.id === id);
            if (file?.type === 'folder') {
                const descendantIds = getDescendantIds(id, files);
                descendantIds.forEach(descId => allIdsToDelete.add(descId));
            }
        });
        setFiles(prevFiles => prevFiles.filter(f => !allIdsToDelete.has(f.id)));
        clearSelection();
    };
    
    const handleEmptyTrash = () => {
        setFiles(files.filter(f => !f.isTrashed));
    };
    
    const handleToggleFavorite = (id: number) => {
        setFiles(files.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f));
    };
    const handleMoveFiles = (draggedIds: Set<number>, targetFolderId: number | null) => {
        setFiles(files.map(f => {
            if (draggedIds.has(f.id)) {
                return { ...f, parentId: targetFolderId, lastModified: Date.now() };
            }
            return f;
        }));
        clearSelection();
    };
    
    const handleContextMenu = (e: React.MouseEvent, file: FileItem | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (file && !selectedIds.has(file.id)) {
            setSelectedIds(new Set([file.id]));
        }
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    };

    const handleViewDetails = () => {
        const detailsModal: ModalState = { type: 'details', files: selectedFiles };
        setModal(detailsModal);
    };

    const handleTogglePreview = () => {
        if (previewingFileId) {
            setPreviewingFileId(null);
        } else if (selectedIds.size === 1) {
            setPreviewingFileId(Array.from(selectedIds)[0]);
        }
    };
    
    // --- Clipboard Actions ---
    const handleCopy = () => {
        if (selectedIds.size > 0) {
            setClipboard({ action: 'copy', fileIds: new Set(selectedIds) });
        }
    };
    const handleCut = () => {
        if (selectedIds.size > 0) {
            setClipboard({ action: 'cut', fileIds: new Set(selectedIds) });
        }
    };
    const handlePaste = () => {
        if (!clipboard) return;

        if (clipboard.action === 'cut') {
            // Move files
            setFiles(files.map(f => {
                if (clipboard.fileIds.has(f.id)) {
                    return { ...f, parentId: currentFolderId, lastModified: Date.now() };
                }
                return f;
            }));
        } else if (clipboard.action === 'copy') {
            // Duplicate files (deep copy)
            const newFiles = duplicateFiles(clipboard.fileIds, files, currentFolderId);
            setFiles(prev => [...prev, ...newFiles]);
        }

        setClipboard(null);
    };
    // -------------------------

    const closeContextMenu = useCallback(() => setContextMenu(null), []);
    
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (modal.type !== null) return; // Don't handle shortcuts if a modal is open
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
            return; // Don't interfere with text input
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isCtrl = isMac ? e.metaKey : e.ctrlKey;

        if (isCtrl && e.key === 'a') {
            e.preventDefault();
            setSelectedIds(new Set(displayedFiles.map(f => f.id)));
        } else if (isCtrl && e.key === 'c') {
            e.preventDefault();
            handleCopy();
        } else if (isCtrl && e.key === 'x') {
            e.preventDefault();
            handleCut();
        } else if (isCtrl && e.key === 'v') {
            e.preventDefault();
            handlePaste();
        } else if (e.key === 'Delete') {
            if (selectedIds.size > 0 && location === 'browser') {
                 handleTrash(selectedIds);
            } else if (selectedIds.size > 0 && location === 'trash') {
                 const deleteModal: ModalState = { type: 'confirm-delete', count: selectedIds.size, isPermanent: true, onConfirm: () => handlePermanentDelete(selectedIds) };
                 setModal(deleteModal);
            }
        } else if (e.key === 'Escape') {
            if (contextMenu) closeContextMenu();
            else if (renamingId) setRenamingId(null);
            else if (previewingFileId) setPreviewingFileId(null);
            else if (clipboard) setClipboard(null);
            else clearSelection();
        }
    }, [selectedIds, displayedFiles, contextMenu, closeContextMenu, renamingId, clearSelection, location, previewingFileId, modal.type, clipboard]);
    
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isModalClick = target.closest('.modal-content, .context-menu');
            if (!target.closest('.file-item, .context-menu, .header-actions, .preview-sidebar') && !isModalClick) {
                 clearSelection();
            }
             if (!target.closest('.context-menu')) {
                closeContextMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [clearSelection, closeContextMenu]);


    const selectedFiles = useMemo(() => files.filter(f => selectedIds.has(f.id)), [files, selectedIds]);

    const previewFile = useMemo(() => {
        if (!previewingFileId) return null;
        return files.find(f => f.id === previewingFileId) || null;
    }, [previewingFileId, files]);

    return (
        <div className="flex h-screen bg-background-light font-sans text-text-primary">
            <Sidebar location={location} setLocation={(loc) => {
                setLocation(loc);
                setCurrentFolderId(null);
                setSearchTerm('');
            }} />

            <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${previewFile ? 'pr-80' : ''}`}>
                <Header
                    onUploadClick={() => setModal({ type: 'upload', currentFolderId })}
                    onNewFolderClick={() => setModal({ type: 'new-folder', currentFolderId })}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    isAiSearching={isAiSearching}
                    location={location}
                    onEmptyTrash={() => setModal({type: 'confirm-delete', count: files.filter(f => f.isTrashed).length, isPermanent: true, isEmptyingAll: true, onConfirm: handleEmptyTrash })}
                    selectedIds={selectedIds}
                    onDelete={() => location === 'trash' ? setModal({type: 'confirm-delete', count: selectedIds.size, isPermanent: true, onConfirm: () => handlePermanentDelete(selectedIds)}) : handleTrash(selectedIds)}
                    onRestore={() => handleRestore(selectedIds)}
                    onTogglePreview={handleTogglePreview}
                    previewingFileId={previewingFileId}
                />
                <div className="flex-1 flex overflow-hidden bg-white">
                     <FileBrowser
                        files={displayedFiles}
                        allFiles={files}
                        viewMode={viewMode}
                        onItemClick={handleItemClick}
                        onItemDoubleClick={handleOpen}
                        onContextMenu={handleContextMenu}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        clearSelection={clearSelection}
                        onNavigate={(folderId) => { setCurrentFolderId(folderId); setLocation('browser'); setSearchTerm(''); }}
                        currentFolderId={currentFolderId}
                        sortConfig={sortConfig}
                        setSortConfig={setSortConfig}
                        onMoveFiles={handleMoveFiles}
                        renamingId={renamingId}
                        setRenamingId={setRenamingId}
                        onRename={handleRename}
                        onToggleFavorite={handleToggleFavorite}
                        location={location}
                        searchTerm={searchTerm}
                        searchMode={searchMode}
                        aiSearchResults={aiSearchResults}
                        previewingFileId={previewingFileId}
                        clipboard={clipboard}
                    />
                </div>
            </main>
             {previewFile && <PreviewSidebar file={previewFile} onClose={() => setPreviewingFileId(null)} />}
            
            <ModalRenderer
                modal={modal}
                setModal={setModal}
                files={files}
                setFiles={setFiles}
            />
            
            {contextMenu && (
                <ContextMenu
                    menu={contextMenu}
                    onAction={(action) => {
                         closeContextMenu();
                         const file = contextMenu.file;
                         switch(action) {
                            case 'open': if (file) handleOpen(file); break;
                            case 'preview': if (file) setPreviewingFileId(file.id); break;
                            case 'summarize': if (file) setModal({ type: 'summarize', file }); break;
                            case 'details': handleViewDetails(); break;
                            case 'rename': if (file) setRenamingId(file.id); break;
                            case 'favorite': if (file) handleToggleFavorite(file.id); break;
                            case 'trash': handleTrash(selectedIds); break;
                            case 'restore': handleRestore(selectedIds); break;
                            case 'delete': setModal({type: 'confirm-delete', count: selectedIds.size, isPermanent: true, onConfirm: () => handlePermanentDelete(selectedIds)}); break;
                            case 'copy': handleCopy(); break;
                            case 'cut': handleCut(); break;
                            case 'paste': handlePaste(); break;
                        }
                    }}
                    selectedCount={selectedIds.size}
                    location={location}
                    clipboard={clipboard}
                />
            )}
        </div>
    );
}

export default App;
