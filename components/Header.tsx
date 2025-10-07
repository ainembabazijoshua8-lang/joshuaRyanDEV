
import React from 'react';
import { ViewMode } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    selectedCount: number;
    onNewFolder: () => void;
    onUpload: () => void;
    onDelete: () => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode, selectedCount, onNewFolder, onUpload, onDelete }) => {
    return (
        <header className="flex justify-between items-center mb-6 flex-shrink-0">
            <h2 className="text-3xl font-bold">All Files</h2>
            <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                    <button
                        className="px-4 py-2 bg-danger text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
                        onClick={onDelete}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete {selectedCount}
                    </button>
                )}
                <button
                    className="p-2 border border-border-color rounded-lg text-text-secondary hover:bg-gray-100 transition-colors"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                >
                    {viewMode === 'grid' ? ICONS.list : ICONS.grid}
                </button>
                <button
                    className="px-4 py-2 bg-primary-light text-primary rounded-lg font-semibold hover:bg-blue-200 transition-colors duration-200"
                    onClick={onNewFolder}
                >
                    New Folder
                </button>
                <button
                    className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                    onClick={onUpload}
                >
                    Upload
                </button>
            </div>
        </header>
    );
};

export default Header;
