import React, { useState } from 'react';
import { FileItem } from '../../types';
import { generateUniqueId } from '../../utils/fileUtils';

interface NewFolderModalProps {
    onClose: () => void;
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
    currentFolderId: number | null;
}

const NewFolderModal: React.FC<NewFolderModalProps> = ({ onClose, setFiles, currentFolderId }) => {
    const [folderName, setFolderName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (folderName.trim()) {
            const newFolder: FileItem = {
                id: generateUniqueId(),
                name: folderName.trim(),
                type: 'folder',
                lastModified: Date.now(),
                size: 0,
                parentId: currentFolderId,
            };
            setFiles(prev => [newFolder, ...prev]);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4">New Folder</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={folderName}
                        onChange={e => setFolderName(e.target.value)}
                        placeholder="Enter folder name"
                        autoFocus
                        className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={onClose}>Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700" disabled={!folderName.trim()}>
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewFolderModal;