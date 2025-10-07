import React, { useState, useCallback } from 'react';
import { FileItem } from '../../types';
import { processFilesForUpload } from '../../utils/fileUtils';

interface UploadModalProps {
    onClose: () => void;
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
    currentFolderId: number | null;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, setFiles, currentFolderId }) => {
    const [filesToUpload, setFilesToUpload] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (fileList: FileList | null) => {
        if (fileList) {
            setFilesToUpload(fileList);
        }
    };

    const processAndUpload = useCallback(async () => {
        if (!filesToUpload || filesToUpload.length === 0) return;
        setIsUploading(true);
        
        const newFiles = await processFilesForUpload(filesToUpload, currentFolderId);
        
        setFiles(prev => [...newFiles, ...prev]);
        setIsUploading(false);
        onClose();
    }, [filesToUpload, setFiles, onClose, currentFolderId]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4">Upload Files</h3>
                <div 
                    className="relative border-2 border-dashed border-border-color rounded-lg p-10 text-center cursor-pointer hover:border-primary transition-colors"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFileChange(e.dataTransfer.files); }}
                >
                    <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={e => handleFileChange(e.target.files)}
                        accept="image/*,.pdf,.txt,.md,.doc,.docx"
                    />
                    <p className="text-text-secondary">
                        {filesToUpload && filesToUpload.length > 0 ? `${filesToUpload.length} file(s) selected` : "Drag & drop files here, or click to select"}
                    </p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={onClose}>Cancel</button>
                    <button 
                        className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={!filesToUpload || filesToUpload.length === 0 || isUploading}
                        onClick={processAndUpload}
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;