import React, { useState } from 'react';
import { FileItem, ModalState } from '../../types.ts';
import { generateUniqueId } from '../../utils/fileUtils.ts';

interface NewFolderModalProps {
    onClose: () => void;
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
    currentFolderId: number | null;
    allFiles: FileItem[];
    // Fix: Added missing setModalState prop to align with its usage in ModalRenderer.tsx
    setModalState: (state: ModalState) => void;
    initialName?: string;
}

const NewFolderModal: React.FC<NewFolderModalProps> = ({ onClose, setFiles, currentFolderId, allFiles, initialName }) => {
    const [folderName, setFolderName] = useState(initialName || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimmedName = folderName.trim();

        if (trimmedName) {
            const nameExists = allFiles.some(
                file => file.parentId === currentFolderId && file.name.toLowerCase() === trimmedName.toLowerCase()
            );

            if (nameExists) {
                setError(`A file or folder named "${trimmedName}" already exists.`);
                return;
            }

            const newFolder: FileItem = {
                id: generateUniqueId(),
                name: trimmedName,
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
                        onChange={e => {
                            setFolderName(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="Enter folder name"
                        autoFocus
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${error ? 'border-danger focus:ring-danger' : 'border-border-color focus:ring-primary'}`}
                    />
                    {error && <p className="text-danger text-sm mt-2">{error}</p>}
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