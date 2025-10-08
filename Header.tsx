import React, { useRef } from 'react';
import { ICONS } from './constants.tsx';
import { ViewMode, FileItem, Location, ContextAction } from './types.ts';

interface HeaderProps {
    onUploadClick: () => void;
    onNewFolderClick: () => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchMode: 'filename' | 'content';
    setSearchMode: React.Dispatch<React.SetStateAction<'filename' | 'content'>>;
    isAiSearching: boolean;
    location: Location;
    selectedFiles: FileItem[];
    onAction: (action: ContextAction, fileId: number | null) => void;
    clearSelection: () => void;
    allFiles: FileItem[];
}

const Header: React.FC<HeaderProps> = ({ 
    onUploadClick, onNewFolderClick, viewMode, setViewMode, 
    searchQuery, setSearchQuery, searchMode, setSearchMode,
    isAiSearching, location, selectedFiles, onAction, clearSelection, allFiles
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isSelectionActive = selectedFiles.length > 0;
    const areAllSelectedFavorites = selectedFiles.every(f => f.isFavorite);

    const renderDefaultActions = () => {
        if (location === 'browser') {
            return (
                <>
                    <button onClick={onNewFolderClick} className="px-4 py-2 rounded-lg text-text-secondary font-medium bg-gray-100 hover:bg-gray-200">New Folder</button>
                    <button onClick={onUploadClick} className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700">Upload</button>
                </>
            );
        }
        if (location === 'trash') {
            return (
                <button 
                    onClick={() => onAction('emptyTrash', null)} 
                    className="px-4 py-2 rounded-lg bg-danger text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                    disabled={!allFiles.some(f => f.trashedOn)}
                >
                    Empty Trash
                </button>
            );
        }
        return null;
    };
    
    const renderSelectionActions = () => {
        if (location === 'trash') {
            return (
                <div className="flex items-center gap-4 bg-primary-light p-2 rounded-lg">
                    <button onClick={clearSelection} className="p-1.5 rounded hover:bg-gray-200" aria-label="Clear selection">
                        {ICONS.close}
                    </button>
                    <span className="font-semibold text-primary pr-4 border-r">{selectedFiles.length} selected</span>
                    <button onClick={() => onAction('restore', null)} className="p-1.5 rounded hover:bg-gray-200" aria-label="Restore">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                    </button>
                    <button onClick={() => onAction('delete', null)} className="p-1.5 rounded hover:bg-gray-200 text-danger" aria-label="Delete Forever">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            )
        }
        return (
            <div className="flex items-center gap-4 bg-primary-light p-2 rounded-lg">
                <button onClick={clearSelection} className="p-1.5 rounded hover:bg-gray-200" aria-label="Clear selection">
                    {ICONS.close}
                </button>
                <span className="font-semibold text-primary pr-4 border-r">{selectedFiles.length} selected</span>
                <button onClick={() => onAction('favorite', null)} className="p-1.5 rounded hover:bg-gray-200" aria-label={areAllSelectedFavorites ? "Unfavorite" : "Favorite"}>
                    {areAllSelectedFavorites ? ICONS.starFilled : ICONS.starOutline}
                </button>
                <button onClick={() => onAction('download', null)} disabled={selectedFiles.length !== 1 || selectedFiles[0].type === 'folder'} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Download">
                    {ICONS.download}
                </button>
                <button onClick={() => onAction('delete', null)} className="p-1.5 rounded hover:bg-gray-200 text-danger" aria-label="Delete">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        );
    }

    return (
        <header className="p-8 pb-4 flex items-center justify-between flex-shrink-0">
            <div className="relative w-full max-w-md">
                <form onSubmit={(e) => e.preventDefault()}>
                    <input ref={searchInputRef} type="text"
                        placeholder={searchMode === 'content' ? "Search content with AI..." : "Search by filename..."}
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-32 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                </form>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isAiSearching ? (
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : ICONS.search}
                </div>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <label className="flex items-center cursor-pointer">
                        <span className="text-xs font-medium text-text-secondary mr-2">Content (AI)</span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={searchMode === 'content'} onChange={() => setSearchMode(prev => prev === 'content' ? 'filename' : 'content')} />
                            <div className={`block w-10 h-5 rounded-full ${searchMode === 'content' ? 'bg-primary' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${searchMode === 'content' ? 'translate-x-full' : ''}`}></div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setViewMode('grid')} aria-label="Grid view" className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}>{ICONS.grid}</button>
                    <button onClick={() => setViewMode('list')} aria-label="List view" className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}>{ICONS.list}</button>
                </div>
                {isSelectionActive ? renderSelectionActions() : renderDefaultActions()}
            </div>
        </header>
    );
};

export default Header;