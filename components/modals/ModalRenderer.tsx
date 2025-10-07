import React from 'react';
import { ModalState, FileItem } from '../../types';
import UploadModal from './UploadModal';
import NewFolderModal from './NewFolderModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import EditorModal from './EditorModal';
import DetailsModal from './DetailsModal';
import SummaryModal from './SummaryModal';

interface ModalRendererProps {
    modal: ModalState;
    setModal: (modal: ModalState) => void;
    files: FileItem[];
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
    selectedIds: Set<number>;
    clearSelection: () => void;
}

const ModalRenderer: React.FC<ModalRendererProps> = ({ modal, setModal, files, setFiles, selectedIds, clearSelection }) => {
    const closeModal = () => setModal({ type: null });

    const handleConfirmDelete = () => {
        setFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
        clearSelection();
        closeModal();
    };
    
    // Add a guard to handle the `null` modal type explicitly.
    // This helps TypeScript's control flow analysis correctly narrow the `modal` type
    // within the subsequent switch statement, resolving property access errors.
    if (!modal.type) {
        return null;
    }

    // Use a single switch statement for type narrowing.
    // This ensures that properties like `modal.count` or `modal.file` are only accessed
    // when the modal type is correctly identified. The `null` case is handled explicitly.
    switch (modal.type) {
        case 'upload':
            return <UploadModal onClose={closeModal} setFiles={setFiles} />;
        case 'new-folder':
            return <NewFolderModal onClose={closeModal} setFiles={setFiles} />;
        case 'confirm-delete':
            return <ConfirmDeleteModal onClose={closeModal} onConfirm={handleConfirmDelete} count={modal.count} />;
        case 'view':
            return <EditorModal file={modal.file} onClose={closeModal} setFiles={setFiles} />;
        case 'details':
            return <DetailsModal file={modal.file} onClose={closeModal} />;
        case 'summarize':
            return <SummaryModal file={modal.file} onClose={closeModal} />;
        default:
            return null;
    }
};

export default ModalRenderer;