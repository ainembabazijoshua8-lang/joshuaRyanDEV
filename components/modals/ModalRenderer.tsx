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

    // Fix: Replaced the if-chain with a switch statement. This is a more robust and standard
    // way to handle discriminated unions in TypeScript, ensuring correct type narrowing
    // within each case block and fixing property access errors.
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
            return null;
    }
};

export default ModalRenderer;