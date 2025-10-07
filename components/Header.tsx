
import React from 'react';
import { ViewMode, SearchMode } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
    onUploadClick: () => void;
    onNewFolderClick: () => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchMode: SearchMode;
    setSearchMode: (mode: SearchMode) => void;
    isAiSearching: boolean;
    location: 'browser' | 'trash' | 'favorites' | 'recents';
    onEmptyTrash: () => void;
    selectedIds: Set<number>;
    onDelete: () => void;
    onRestore: () => void;
    onTogglePreview: () => void;
    previewingFileId: number | null;
}

const Header: React.FC<HeaderProps> = ({
    onUploadClick,
    onNewFolderClick,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    searchMode,
    setSearchMode,
    isAiSearching,
    location,
    onEmptyTrash,
    selectedIds,
    onDelete,
    onRestore,
    onTogglePreview,
    previewingFileId
}) => {
    
    const getHeaderTitle = () => {
        if (searchTerm) return `Search results for "${searchTerm}"`;
        switch(location) {
            case 'browser': return 'All Files';
            case 'trash': return 'Trash';
            case 'favorites': return 'Favorites';
            case 'recents': return 'Recent Files';
        }
    }

    const getSearchPlaceholder = () => {
        if (location === 'favorites') return 'Search favorites...';
        if (location === 'trash') return 'Search trash...';
        if (location === 'recents') return 'Search recent files...';
        if (searchMode === 'content') return 'Search file contents with AI...';
        return 'Search files...';
    }

    const renderBrowserActions = () => (
        <>
            <button 
                onClick={onTogglePreview} 
                disabled={selectedIds.size !== 1}
                className="px-4 py-2 rounded-lg text-text-primary font-semibold border border-border-color hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {previewingFileId ? 'Close Preview' : 'Preview'}
            </button>
            <button onClick={onNewFolderClick} disabled={location !== 'browser'} className="px-4 py-2 rounded-lg text-text-primary font-semibold border border-border-color hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                New Folder
            </button>
            <button onClick={onUploadClick} disabled={location !== 'browser'} className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Upload
            </button>
        </>
    );

    const renderTrashActions = () => (
        <>
            <button onClick={onRestore} disabled={selectedIds.size === 0} className="px-4 py-2 rounded-lg text-text-primary font-semibold border border-border-color hover:bg-gray-100 disabled:opacity-50">
                Restore
            </button>
            <button onClick={onDelete} disabled={selectedIds.size === 0} className="px-4 py-2 rounded-lg bg-danger text-white font-semibold hover:bg-red-700 disabled:opacity-50">
                Delete Forever
            </button>
            <button onClick={onEmptyTrash} className="px-4 py-2 rounded-lg bg-danger text-white font-semibold hover:bg-red-700">
                Empty Trash
            </button>
        </>
    );
    
    return (
        <header className="p-4 border-b border-border-color flex-shrink-0 bg-white z-10 header-actions space-y-4">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold text-text-primary">{getHeaderTitle()}</h2>
                <div className="flex items-center gap-4">
                    {location === 'trash' ? renderTrashActions() : renderBrowserActions()}

                    <div className="flex items-center border border-border-color rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-l-md ${viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                            aria-label="Switch to Grid view"
                        >
                           {ICONS.grid}
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-r-md ${viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                            aria-label="Switch to List view"
                        >
                           {ICONS.list}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-grow max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       {ICONS.search}
                    </div>
                    <input
                        type="search"
                        placeholder={getSearchPlaceholder()}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                {location !== 'trash' && (
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                        <button 
                            onClick={() => setSearchMode('filename')}
                            className={`px-3 py-1 text-sm font-semibold rounded-md ${searchMode === 'filename' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'}`}
                        >
                            Filename
                        </button>
                        <button 
                            onClick={() => setSearchMode('content')}
                            className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md ${searchMode === 'content' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'}`}
                        >
                            Content (AI)
                            {isAiSearching && <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
