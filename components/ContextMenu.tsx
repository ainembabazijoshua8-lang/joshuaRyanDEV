import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileItem, Location, ContextAction } from '../types.ts';

interface UseContextMenuReturn {
    contextMenu: ContextMenuState | null;
    handleContextMenu: (e: React.MouseEvent, fileId: number | null) => void;
    closeContextMenu: () => void;
}
interface ContextMenuState { x: number; y: number; fileId: number | null; }

export const useContextMenu = (): UseContextMenuReturn => {
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const handleContextMenu = useCallback((e: React.MouseEvent, fileId: number | null) => {
        e.preventDefault(); e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, fileId });
    }, []);

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    useEffect(() => {
        const handleClick = () => closeContextMenu();
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [closeContextMenu]);

    return { contextMenu, handleContextMenu, closeContextMenu };
};

interface ContextMenuProps extends ContextMenuState {
    files: FileItem[];
    selectedIds: Set<number>;
    location: Location;
    onClose: () => void;
    onAction: (action: ContextAction, fileId: number | null) => void;
    clipboard: any;
}

const ContextMenu: React.FC<ContextMenuProps> = (props) => {
    const { x, y, fileId, onClose, files, selectedIds, location, onAction, clipboard } = props;
    
    const contextFileId = useMemo(() => {
        if (fileId !== null && !selectedIds.has(fileId)) return fileId;
        if (selectedIds.size > 0) return Array.from(selectedIds)[0];
        return null;
    }, [fileId, selectedIds]);

    const targetFile = useMemo(() => files.find(f => f.id === contextFileId) || null, [files, contextFileId]);
    
    const isSelection = selectedIds.size > 0 || fileId !== null;
    const isSingleFileSelection = (selectedIds.size === 1 || (fileId !== null && selectedIds.size === 0)) && targetFile?.type === 'file';
    const isSingleSelection = selectedIds.size === 1 || (fileId !== null && selectedIds.size === 0);
    const areAllSelectedFavorites = useMemo(() => {
        if (!isSelection) return false;
        const targetIds = fileId !== null && !selectedIds.has(fileId) ? [fileId] : Array.from(selectedIds);
        return targetIds.every(id => files.find(f => f.id === id)?.isFavorite);
    }, [selectedIds, fileId, files, isSelection]);
    
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (menuRef.current) {
            const { innerWidth, innerHeight } = window;
            const { offsetWidth, offsetHeight } = menuRef.current;
            menuRef.current.style.left = `${Math.min(x, innerWidth - offsetWidth - 5)}px`;
            menuRef.current.style.top = `${Math.min(y, innerHeight - offsetHeight - 5)}px`;
        }
    }, [x, y]);

    const isSummarizable = targetFile?.versions && targetFile.versions.length > 0;
    const isViewableInNewTab = targetFile && (!!targetFile.url || (!!targetFile.versions && targetFile.versions.length > 0));

    const MenuItem: React.FC<{ action: ContextAction, disabled?: boolean, children: React.ReactNode, isDanger?: boolean }> = ({ action, disabled, children, isDanger }) => (
        <button
            onClick={(e) => { e.stopPropagation(); onAction(action, fileId); onClose(); }}
            disabled={disabled}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${isDanger ? 'text-danger' : 'text-text-primary'} hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}>
            {children}
        </button>
    );

    return (
        <div ref={menuRef} style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()} className="fixed bg-white rounded-md shadow-lg border border-border-color py-1 w-56 z-50">
            {location === 'browser' && (
                <>
                    {isSingleFileSelection && <MenuItem action="preview">Quick Preview</MenuItem>}
                    {isSingleFileSelection && <MenuItem action="openInNewTab" disabled={!isViewableInNewTab}>Open in New Tab</MenuItem>}
                    {isSelection && <hr className="my-1"/>}
                    {isSingleSelection && <MenuItem action="rename">Rename</MenuItem>}
                    {isSelection && <MenuItem action="cut">Cut</MenuItem>}
                    {isSelection && <MenuItem action="copy">Copy</MenuItem>}
                    <MenuItem action="paste" disabled={!clipboard}>Paste</MenuItem>
                </>
            )}

            {location === 'trash' && isSelection && <MenuItem action="restore">Restore</MenuItem>}
            
            {location !== 'trash' && isSelection && (
                <>
                    <hr className="my-1"/>
                    <MenuItem action="favorite">{areAllSelectedFavorites ? 'Remove from Favorites' : 'Add to Favorites'}</MenuItem>
                    {isSingleFileSelection && isSummarizable && <MenuItem action="summary">Summarize with AI</MenuItem>}
                    {isSingleFileSelection && <MenuItem action="download" disabled={!targetFile?.url && !targetFile?.versions}>Download</MenuItem>}
                    <MenuItem action="details">Get Details</MenuItem>
                </>
            )}

            {isSelection && <hr className="my-1" />}
            {isSelection && <MenuItem action="delete" isDanger>
                {location === 'trash' ? 'Delete Forever' : 'Move to Trash'}
            </MenuItem>}
        </div>
    );
};

export default ContextMenu;