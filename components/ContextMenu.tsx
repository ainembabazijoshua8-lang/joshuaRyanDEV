
import React, { useEffect, useRef } from 'react';
import { ContextMenuState, ClipboardState } from '../types';
import { isEditable } from '../utils/fileUtils';

type ContextAction = 'open' | 'preview' | 'summarize' | 'details' | 'rename' | 'favorite' | 'trash' | 'restore' | 'delete' | 'copy' | 'cut' | 'paste';

interface ContextMenuProps {
    menu: ContextMenuState;
    onAction: (action: ContextAction) => void;
    selectedCount: number;
    // Fix: Added 'recents' to the location type to match the possible values from App state.
    location: 'browser' | 'trash' | 'favorites' | 'recents';
    clipboard: ClipboardState | null;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ menu, onAction, selectedCount, location, clipboard }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuRef.current) return;
        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = menuRef.current;
        const x = menu.x + offsetWidth > innerWidth ? innerWidth - offsetWidth - 10 : menu.x;
        const y = menu.y + offsetHeight > innerHeight ? innerHeight - offsetHeight - 10 : menu.y;
        menuRef.current.style.left = `${x}px`;
        menuRef.current.style.top = `${y}px`;
    }, [menu]);

    const handleAction = (action: ContextAction) => {
        onAction(action);
    };
    
    const isTrashView = location === 'trash';
    const canPaste = clipboard !== null && location === 'browser';
    const hasSelection = selectedCount > 0;
    const file = menu.file;

    return (
        <div
            ref={menuRef}
            className="context-menu fixed bg-white rounded-lg shadow-lg border border-border-color py-2 w-56 z-50 text-sm"
            style={{ top: menu.y, left: menu.x }}
        >
            <ul>
                {!isTrashView ? (
                    <>
                        {file && <MenuItem onClick={() => handleAction('open')}>Open</MenuItem>}
                        {file && <MenuItem onClick={() => handleAction('preview')}>Preview</MenuItem>}
                        {file && isEditable(file.name) && file.versions && file.versions.length > 0 && selectedCount === 1 && (
                            <MenuItem onClick={() => handleAction('summarize')}>Summarize with AI</MenuItem>
                        )}
                        <Divider />
                        <MenuItem onClick={() => handleAction('cut')} disabled={!hasSelection}>Cut</MenuItem>
                        <MenuItem onClick={() => handleAction('copy')} disabled={!hasSelection}>Copy</MenuItem>
                        <MenuItem onClick={() => handleAction('paste')} disabled={!canPaste}>Paste</MenuItem>
                        <Divider />
                        {file && <MenuItem onClick={() => handleAction('rename')}>Rename</MenuItem>}
                        {file && <MenuItem onClick={() => handleAction('favorite')}>
                            {file.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                        </MenuItem>}
                        <Divider />
                         <MenuItem onClick={() => handleAction('details')} disabled={!hasSelection}>
                            {selectedCount > 1 ? `View Details (${selectedCount} items)` : 'View Details'}
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => handleAction('trash')} className="text-danger" disabled={!hasSelection}>Move to Trash</MenuItem>
                    </>
                ) : (
                    <>
                        <MenuItem onClick={() => handleAction('restore')} disabled={!hasSelection}>Restore</MenuItem>
                        <MenuItem onClick={() => handleAction('delete')} className="text-danger" disabled={!hasSelection}>Delete Forever</MenuItem>
                    </>
                )}
            </ul>
        </div>
    );
};

const MenuItem: React.FC<{ onClick: () => void; className?: string; disabled?: boolean; children: React.ReactNode }> = ({ onClick, className = '', disabled = false, children }) => (
    <li
        onClick={!disabled ? onClick : undefined}
        className={`px-4 py-2 ${disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'} ${className}`}
    >
        {children}
    </li>
);

const Divider = () => <li className="h-px bg-border-color my-1"></li>;

export default ContextMenu;
