import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import FileBrowser from './components/FileBrowser.tsx';
import ModalRenderer from './components/modals/ModalRenderer.tsx';
import PreviewSidebar from './components/PreviewSidebar.tsx';
import { useFiles } from './hooks/useFiles.ts';
import { useFileSelection } from './hooks/useFileSelection.ts';
import { useDragAndDrop } from './hooks/useDragAndDrop.ts';
import { FileItem, Location, ModalState, SortConfig, ContextAction, ClipboardState, ChatMessage, AiSearchResult, AiAssistantResponse } from './types.ts';
import { initialFiles } from './initialData.ts';
import { processSingleFileForUpload, findRestorationParent, downloadFile, duplicateFiles, isDroppingInChild, generateUniqueId, isEditable } from './utils/fileUtils.ts';
import { performAiSearch, invokeAiAssistant } from './services/geminiService.ts';

const App: React.FC = () => {
    const { files, setFiles, sortConfig, setSortConfig, sortedFiles: allSortedFiles } = useFiles(initialFiles);
    const [location, setLocation] = useState<Location>('browser');
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalState, setModalState] = useState<ModalState>(null);
    const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState<'filename' | 'content'>('filename');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiSearchResults, setAiSearchResults] = useState<AiSearchResult[] | null>(null);

    // AI Assistant State
    const [assistantHistory, setAssistantHistory] = useState<ChatMessage[]>([]);
    const [isAssistantProcessing, setIsAssistantProcessing] = useState(false);

    // Preview State
    const [previewingFileId, setPreviewingFileId] = useState<number | null>(null);
    
    // Ref for accessing latest files in cleanup effect
    const filesRef = useRef(files);
    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    // Effect to revoke blob URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            filesRef.current.forEach(file => {
                if (file.url && file.url.startsWith('blob:')) {
                    URL.revokeObjectURL(file.url);
                }
            });
        };
    }, []);

    // Effect to clear search when location changes
    useEffect(() => {
        setSearchQuery('');
        setAiSearchResults(null);
    }, [location]);
    
    // Effect to run search when query or mode changes
    useEffect(() => {
        const handler = setTimeout(() => {
            const runSearch = async () => {
                if (searchMode === 'content' && searchQuery) {
                    setIsAiSearching(true);
                    setAiSearchResults(null);
                    try {
                        const results = await performAiSearch(files, searchQuery);
                        setAiSearchResults(results);
                    } catch (error) {
                        console.error("AI search failed", error);
                        alert("AI search failed. Please try again.");
                        setAiSearchResults(null);
                    } finally {
                        setIsAiSearching(false);
                    }
                } else {
                    setAiSearchResults(null);
                }
            };
            runSearch();
        }, 300); // Debounce search
        return () => clearTimeout(handler);
    }, [searchQuery, searchMode, files]);


    const currentPath = useMemo(() => {
        const path = [currentFolderId];
        let parentId = currentFolderId;
        while (parentId !== null) {
            const parent = files.find(f => f.id === parentId);
            parentId = parent ? parent.parentId : null;
            if (parentId !== null) path.unshift(parentId);
        }
        return path;
    }, [currentFolderId, files]);

    const filesToDisplay = useMemo(() => {
        // 1. Determine the base pool of files based on location (favorites, recents, trash, etc.)
        let baseFiles: FileItem[];
        const untrashedFiles = allSortedFiles.filter(f => !f.trashedOn);

        switch (location) {
            case 'trash':
                baseFiles = allSortedFiles.filter(f => f.trashedOn);
                break;
            case 'favorites':
                baseFiles = untrashedFiles.filter(file => file.isFavorite);
                break;
            case 'recents':
                // 'recents' has its own sorting logic that overrides the main sorter.
                baseFiles = untrashedFiles
                    .filter(file => file.lastOpened)
                    .sort((a, b) => b.lastOpened! - a.lastOpened!)
                    .slice(0, 20);
                break;
            case 'browser':
            default:
                baseFiles = untrashedFiles.filter(file => file.parentId === currentFolderId);
                break;
        }

        // 2. If a search query exists, filter the base pool.
        if (!searchQuery) {
            return baseFiles;
        }

        if (searchMode === 'content' && aiSearchResults) {
            const resultMap = new Map(aiSearchResults.map(r => [r.id, r]));
            // Filter the current location's files by the AI search results.
            return baseFiles.filter(f => resultMap.has(f.id));
        }
        
        // Filename search
        return baseFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    }, [location, allSortedFiles, currentFolderId, searchQuery, searchMode, aiSearchResults]);
    
    const { selectedIds, setSelectedIds, handleItemClick, clearSelection } = useFileSelection(filesToDisplay);
    
    const selectedFiles = useMemo(() => files.filter(f => selectedIds.has(f.id)), [files, selectedIds]);
    const previewingFile = useMemo(() => files.find(f => f.id === previewingFileId) || null, [files, previewingFileId]);

    useEffect(() => {
        if (selectedIds.size === 1) {
            setPreviewingFileId(Array.from(selectedIds)[0]);
        } else {
            setPreviewingFileId(null);
        }
    }, [selectedIds]);

    const handleDrop = useCallback(async (droppedFiles: FileList) => {
        for (const file of Array.from(droppedFiles)) {
            try {
                const newFile = await processSingleFileForUpload(
                    file, 
                    currentFolderId, 
                    () => {}, // No progress UI for drag-drop
                    new AbortController().signal
                );
                setFiles(prev => [newFile, ...prev]);
            } catch(error) {
                console.error(`Error uploading file via drag and drop: ${file.name}`, error);
                alert(`Could not upload file: ${file.name}.`);
            }
        }
    }, [currentFolderId, setFiles]);

    useDragAndDrop({ onDrop: handleDrop });

    const handleRename = (fileId: number, newName: string) => {
        setFiles(files.map(file => (file.id === fileId ? { ...file, name: newName, lastModified: Date.now() } : file)));
        setEditingId(null);
    };

    const handleNavigate = (folderId: number | null) => {
        setCurrentFolderId(folderId);
        clearSelection();
        setSearchQuery('');
    };
    
    const handleItemDoubleClick = (file: FileItem) => {
        if (file.type === 'folder') {
            handleNavigate(file.id);
        } else {
             setFiles(prev => prev.map(f => f.id === file.id ? { ...f, lastOpened: Date.now() } : f));
             if (isEditable(file.name)) {
                setModalState({ type: 'editor', file });
             }
        }
    };
    
    const handleMove = useCallback((draggedIds: Set<number>, targetFolderId: number | null) => {
        setFiles(currentFiles => {
            const firstDraggedFile = currentFiles.find(f => draggedIds.has(f.id));
            if (firstDraggedFile && firstDraggedFile.parentId === targetFolderId) {
                return currentFiles;
            }
    
            if (isDroppingInChild(draggedIds, targetFolderId, currentFiles)) {
                alert("Cannot move a folder into itself or one of its children.");
                return currentFiles;
            }
            
            return currentFiles.map(f => 
                draggedIds.has(f.id) ? { ...f, parentId: targetFolderId } : f
            );
        });
        clearSelection();
    }, [setFiles, clearSelection]);
    
    const executeAiActions = (response: AiAssistantResponse) => {
        setFiles(currentFiles => {
            let tempFiles = [...currentFiles];
            let tempSelectedIds = new Set(selectedIds);

            for (const act of response.actions) {
                switch(act.action) {
                    case 'selectFiles': {
                        const idsToSelect = new Set<number>();
                        tempFiles.forEach(f => {
                            if (act.fileNames.includes(f.name)) {
                                idsToSelect.add(f.id);
                            }
                        });
                        tempSelectedIds = idsToSelect;
                        break;
                    }
                    case 'createFolder': {
                        const newFolder: FileItem = { id: generateUniqueId(), name: act.folderName, type: 'folder', lastModified: Date.now(), size: 0, parentId: currentFolderId };
                        tempFiles.push(newFolder);
                        break;
                    }
                    case 'renameFile': {
                        const fileToRename = tempFiles.find(f => f.name === act.oldName);
                        if (fileToRename) {
                           tempFiles = tempFiles.map(f => f.id === fileToRename.id ? {...f, name: act.newName} : f);
                        }
                        break;
                    }
                    case 'moveFiles': {
                        let destFolder = tempFiles.find(f => f.name === act.destinationFolderName && f.type === 'folder');
                        if (!destFolder) {
                           destFolder = { id: generateUniqueId(), name: act.destinationFolderName, type: 'folder', lastModified: Date.now(), size: 0, parentId: currentFolderId };
                           tempFiles.push(destFolder);
                        }
                        const filesToMoveIds = new Set(tempFiles.filter(f => act.fileNames.includes(f.name)).map(f => f.id));
                        
                        if (filesToMoveIds.has(destFolder.id)) {
                            filesToMoveIds.delete(destFolder.id);
                        }
                        
                        tempFiles = tempFiles.map(f => filesToMoveIds.has(f.id) ? {...f, parentId: destFolder!.id} : f);
                        break;
                    }
                     case 'deleteFiles': {
                        const filesToDeleteIds = new Set(tempFiles.filter(f => act.fileNames.includes(f.name)).map(f => f.id));
                        tempFiles = tempFiles.map(f => filesToDeleteIds.has(f.id) ? {...f, trashedOn: Date.now()} : f);
                        break;
                    }
                }
            }
            setSelectedIds(tempSelectedIds);
            return tempFiles;
        });
    };
    
     const handleAssistantPrompt = async (prompt: string) => {
        const userMessage: ChatMessage = { role: 'user', content: prompt };
        setAssistantHistory(prev => [...prev, userMessage]);
        setIsAssistantProcessing(true);
        try {
            const response = await invokeAiAssistant(prompt, files, selectedIds, currentFolderId);
            const modelMessage: ChatMessage = { role: 'model', content: response.explanation };
            setAssistantHistory(prev => [...prev, modelMessage]);
            executeAiActions(response);
            setModalState(null);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I couldn't process that command." };
            setAssistantHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsAssistantProcessing(false);
        }
    };


    const handleAction = (action: ContextAction, fileId: number | null) => {
        const targetIds = fileId !== null && !selectedIds.has(fileId) ? new Set([fileId]) : selectedIds;
        const targetFiles = files.filter(f => targetIds.has(f.id));
        
        if (targetIds.size === 0 && !['paste', 'emptyTrash'].includes(action)) return;

        switch (action) {
            case 'rename':
                setEditingId(targetFiles[0].id);
                break;
            case 'cut':
            case 'copy':
                setClipboard({ action, fileIds: targetIds });
                break;
            case 'paste':
                if (!clipboard) return;
                if (clipboard.action === 'copy') {
                    const newFiles = duplicateFiles(clipboard.fileIds, files, currentFolderId);
                    setFiles(prev => [...prev, ...newFiles]);
                } else { // 'cut'
                    const firstFileToMove = files.find(f => clipboard.fileIds.has(f.id));
                    if (firstFileToMove && firstFileToMove.parentId === currentFolderId) {
                         setClipboard(null); // Pasting into the same folder, just cancel 'cut'
                         return;
                    }
                    setFiles(prev => prev.map(f => clipboard.fileIds.has(f.id) ? { ...f, parentId: currentFolderId } : f));
                    setClipboard(null);
                }
                break;
            case 'delete':
                if (location === 'trash') {
                    setModalState({ 
                        type: 'confirmAction', 
                        title: `Permanently delete ${targetIds.size} item(s)?`,
                        message: 'This action is permanent and cannot be undone.',
                        confirmText: 'Delete',
                        confirmClass: 'bg-danger hover:bg-red-700',
                        onConfirm: () => {
                            setFiles(prevFiles => {
                                const filesToDelete = prevFiles.filter(f => targetIds.has(f.id));
                                // Revoke blob URLs for files being permanently deleted to prevent memory leaks.
                                filesToDelete.forEach(file => {
                                    if (file.url && file.url.startsWith('blob:')) {
                                        URL.revokeObjectURL(file.url);
                                    }
                                });
                                return prevFiles.filter(f => !targetIds.has(f.id));
                            });
                            setModalState(null);
                            clearSelection();
                        }
                    });
                } else {
                     setFiles(prev => prev.map(f => targetIds.has(f.id) ? { ...f, trashedOn: Date.now() } : f));
                }
                clearSelection();
                break;
            case 'emptyTrash':
                {
                    const trashedFilesCount = files.filter(f => f.trashedOn).length;
                    if (trashedFilesCount > 0) {
                        setModalState({
                            type: 'confirmAction',
                            title: 'Empty Trash?',
                            message: `Are you sure you want to permanently delete all ${trashedFilesCount} items? This action cannot be undone.`,
                            confirmText: 'Empty Trash',
                            confirmClass: 'bg-danger hover:bg-red-700',
                            onConfirm: () => {
                                setFiles(prev => prev.filter(f => !f.trashedOn));
                                setModalState(null);
                                clearSelection();
                            },
                        });
                    }
                }
                break;
            case 'restore':
                setFiles(prev => prev.map(f => {
                    if (targetIds.has(f.id)) {
                        return { ...f, trashedOn: undefined, parentId: findRestorationParent(f, prev) };
                    }
                    return f;
                }));
                clearSelection();
                break;
            case 'favorite':
                const areAllFavorites = targetFiles.every(f => f.isFavorite);
                setFiles(prev => prev.map(f => targetIds.has(f.id) ? { ...f, isFavorite: !areAllFavorites } : f));
                break;
            case 'details':
                setModalState({ type: 'details', files: targetFiles });
                break;
            case 'summary':
                if (targetFiles.length === 1) setModalState({ type: 'summary', file: targetFiles[0] });
                break;
            case 'download':
                 if (targetFiles.length === 1) downloadFile(targetFiles[0]);
                break;
            case 'preview':
                if (targetFiles.length === 1) {
                    setPreviewingFileId(targetFiles[0].id);
                }
                break;
            case 'openInNewTab':
                if (targetFiles.length === 1) {
                    const fileToOpen = targetFiles[0];
                    let urlToOpen: string | null = null;
                    let createdBlobUrl = false;

                    if (fileToOpen.url) {
                        urlToOpen = fileToOpen.url;
                    } else if (fileToOpen.versions && fileToOpen.versions.length > 0) {
                        const blob = new Blob([fileToOpen.versions[0].content], { type: 'text/plain' });
                        urlToOpen = URL.createObjectURL(blob);
                        createdBlobUrl = true;
                    }

                    if (urlToOpen) {
                        window.open(urlToOpen, '_blank');
                        setFiles(prev => prev.map(f => f.id === fileToOpen.id ? { ...f, lastOpened: Date.now() } : f));
                        // If we created a temporary blob URL, revoke it after a short delay
                        // to give the new tab a chance to load it.
                        if (createdBlobUrl) {
                            setTimeout(() => URL.revokeObjectURL(urlToOpen!), 100);
                        }
                    } else {
                        alert(`No viewable content for ${fileToOpen.name}`);
                    }
                }
                break;
        }
    };
    
    return (
        <div className="h-screen w-screen flex bg-background font-sans">
            <Sidebar location={location} setLocation={setLocation} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    onUploadClick={() => setModalState({ type: 'upload', currentFolderId })}
                    onNewFolderClick={() => setModalState({ type: 'newFolder', currentFolderId })}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    isAiSearching={isAiSearching}
                    location={location}
                    selectedFiles={selectedFiles}
                    onAction={handleAction}
                    clearSelection={clearSelection}
                    allFiles={files}
                />
                 <div className="flex-1 flex overflow-hidden p-8 pt-0">
                    <div className="flex-1 flex flex-col bg-white rounded-xl border border-border-color p-6 overflow-hidden">
                         <FileBrowser
                            files={filesToDisplay}
                            allFiles={files}
                            currentFolderId={currentFolderId}
                            location={location}
                            viewMode={viewMode}
                            selectedIds={selectedIds}
                            editingId={editingId}
                            sortConfig={sortConfig}
                            onItemClick={handleItemClick}
                            onItemDoubleClick={handleItemDoubleClick}
                            onRename={handleRename}
                            setEditingId={setEditingId}
                            onNavigate={handleNavigate}
                            onMove={handleMove}
                            onSortChange={setSortConfig}
                            clearSelection={clearSelection}
                            setSelectedIds={setSelectedIds}
                            onAction={handleAction}
                            clipboard={clipboard}
                            aiSearchResults={aiSearchResults}
                            previewingFileId={previewingFileId}
                        />
                    </div>
                     <PreviewSidebar file={previewingFile} onClose={() => setPreviewingFileId(null)} />
                </div>
                 <button onClick={() => setModalState({ type: 'assistant' })} className="absolute bottom-8 right-8 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-110">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v1.5a1.5 1.5 0 01-3 0V7a1 1 0 00-1-1H7a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /><path d="M10 12.5a1.5 1.5 0 013 0V13a1 1 0 001 1h3a1 1 0 011 1v1.5a1.5 1.5 0 01-3 0V16a1 1 0 00-1-1H7a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V16a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>
                </button>
            </main>
            <ModalRenderer 
                modalState={modalState} 
                setModalState={setModalState}
                setFiles={setFiles}
                assistantHistory={assistantHistory}
                onAssistantPrompt={handleAssistantPrompt}
                isAssistantProcessing={isAssistantProcessing}
                allFiles={files}
                currentFolderId={currentFolderId}
            />
        </div>
    );
};

export default App;