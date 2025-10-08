import React from 'react';
import { ModalState, FileItem, ChatMessage } from '../../types.ts';
import UploadModal from './UploadModal.tsx';
import NewFolderModal from './NewFolderModal.tsx';
import ConfirmDeleteModal from './ConfirmDeleteModal.tsx';
import EditorModal from './EditorModal.tsx';
import DetailsModal from './DetailsModal.tsx';
import SummaryModal from './SummaryModal.tsx';
import AiAssistantModal from './AiAssistantModal.tsx';

interface ModalRendererProps {
    modalState: ModalState;
    setModalState: (state: ModalState) => void;
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
    assistantHistory: ChatMessage[];
    onAssistantPrompt: (prompt: string) => void;
    isAssistantProcessing?: boolean;
    allFiles: FileItem[];
    currentFolderId: number | null;
}

const ModalRenderer: React.FC<ModalRendererProps> = (props) => {
    const { modalState, setModalState, setFiles, assistantHistory, onAssistantPrompt, isAssistantProcessing, allFiles, currentFolderId } = props;
    
    const onClose = () => setModalState(null);
    
    if (!modalState) return null;

    switch (modalState.type) {
        case 'upload':
            return <UploadModal onClose={onClose} setFiles={setFiles} currentFolderId={modalState.currentFolderId} />;
        case 'newFolder':
            return <NewFolderModal 
                onClose={onClose} 
                setFiles={setFiles} 
                currentFolderId={modalState.currentFolderId} 
                allFiles={allFiles}
                setModalState={setModalState}
                initialName={modalState.initialName}
            />;
        case 'confirmAction':
            return <ConfirmDeleteModal onClose={onClose} {...modalState} />;
        case 'editor':
            return <EditorModal file={modalState.file} setModalState={setModalState} setFiles={setFiles} />;
        case 'details':
            return <DetailsModal files={modalState.files} onClose={onClose} />;
        case 'summary':
            return <SummaryModal file={modalState.file} onClose={onClose} />;
        case 'assistant':
             return <AiAssistantModal 
                onClose={onClose} 
                history={assistantHistory}
                onPrompt={onAssistantPrompt}
                isProcessing={isAssistantProcessing}
            />;
        default:
            return null;
    }
};

export default ModalRenderer;