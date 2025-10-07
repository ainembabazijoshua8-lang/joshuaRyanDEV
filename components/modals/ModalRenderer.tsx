
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
}

const ModalRenderer: React.FC<ModalRendererProps> = ({ 
    modal, setModal, files, setFiles
}) => {
    const closeModal = () => setModal({ type: null });

    if (modal.type === null) {
        return null;
    }

    // Fix: Replaced an if-chain with a switch statement. Using a switch on the
    // discriminant property ('type') of a discriminated union ('ModalState') allows
    // TypeScript to correctly narrow the type of 'modal' within each case block,
    // resolving errors about properties not existing on the union type.
    switch (modal.type) {
        case 'upload':
            return <UploadModal onClose={closeModal} setFiles={setFiles} currentFolderId={modal.currentFolderId} />;
        
        case 'new-folder':
            return <NewFolderModal onClose={closeModal} setFiles={setFiles} currentFolderId={modal.currentFolderId} />;

        case 'confirm-delete': {
            const { onConfirm, count, isPermanent, isEmptyingAll } = modal;
            return <ConfirmDeleteModal 
                onClose={closeModal} 
                onConfirm={() => {
                    onConfirm();
                    closeModal();
                }} 
                count={count}
                isPermanent={isPermanent}
                isEmptyingAll={isEmptyingAll}
            />;
        }

        case 'view':
            return <EditorModal file={modal.file} onClose={closeModal} setFiles={setFiles} />;

        case 'details':
            return <DetailsModal files={modal.files} onClose={closeModal} />;

        case 'summarize':
            return <SummaryModal file={modal.file} onClose={closeModal} />;
        
        default:
            // This default case handles any unhandled modal types, ensuring type safety.
            const _exhaustiveCheck: never = modal;
            return null;
    }
};

export default ModalRenderer;
