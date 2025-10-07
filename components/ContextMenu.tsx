
import React from 'react';
import { ContextMenuState, ModalState } from '../types';
import { isEditable, isImage, isPdf } from '../utils/fileUtils';

interface ContextMenuProps {
    menu: ContextMenuState;
    onClose: () => void;
    setModal: (modal: ModalState) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ menu, onClose, setModal }) => {
    const { file } = menu;

    const getActionText = () => {
        if (isEditable(file.name)) return "Edit";
        if (isPdf(file.name) || isImage(file.name)) return "Preview";
        return "Details";
    };

    const handleAction = () => {
        setModal({ type: 'view', file });
        onClose();
    };

    const handleDelete = () => {
        setModal({ type: 'confirm-delete', count: 1 });
        onClose();
    };

    const handleSummarize = () => {
        setModal({ type: 'summarize', file });
        onClose();
    };

    return (
        <div
            className="context-menu fixed z-50 bg-white border border-border-color rounded-lg shadow-lg py-2 w-52 animate-fade-in-fast"
            style={{ top: menu.y, left: menu.x }}
        >
            <button className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100" onClick={handleAction}>
                {getActionText()}
            </button>
            {isEditable(file.name) && file.content && (
                 <button className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100 flex items-center gap-2" onClick={handleSummarize}>
                    <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v1.5a1.5 1.5 0 01-3 0V7a1 1 0 00-1-1H7a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /><path d="M10 12.5a1.5 1.5 0 013 0V13a1 1 0 001 1h3a1 1 0 011 1v1.5a1.5 1.5 0 01-3 0V16a1 1 0 00-1-1H7a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V16a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>
                    Summarize with AI
                </button>
            )}
            <div className="my-1 border-t border-border-color"></div>
            <button className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50" onClick={handleDelete}>
                Delete
            </button>
        </div>
    );
};

export default ContextMenu;
