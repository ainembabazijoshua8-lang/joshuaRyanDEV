import React, { useState, useCallback, useMemo, useRef } from 'react';
import { FileItem, UploadItem } from '../../types.ts';
import { processSingleFileForUpload, formatBytes } from '../../utils/fileUtils.ts';
import { ICONS } from '../../constants.tsx';

interface UploadModalProps {
    onClose: () => void;
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
    currentFolderId: number | null;
}

const StatusIcon: React.FC<{ status: UploadItem['status'] }> = ({ status }) => {
    switch (status) {
        case 'completed':
            return <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>;
        case 'error':
        case 'cancelled':
            return <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>;
        default:
            return null;
    }
};

const UploadItemRow: React.FC<{ item: UploadItem, onCancel: () => void }> = ({ item, onCancel }) => {
    const getStatusText = () => {
        switch(item.status) {
            case 'pending': return 'Pending';
            case 'uploading': return `Uploading... ${Math.round(item.progress)}%`;
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'error': return item.error || 'Error';
        }
    };

    return (
        <div className="flex items-center gap-4 p-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 flex-shrink-0">{ICONS.file}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{item.file.name}</p>
                <p className="text-xs text-text-secondary">{formatBytes(item.file.size)}</p>
            </div>
            <div className="w-48 flex items-center gap-3">
                 <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{getStatusText()}</p>
                 </div>
                 <div className="w-5 h-5">
                    {item.status === 'uploading' || item.status === 'pending' ? (
                        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">&times;</button>
                    ) : (
                        <StatusIcon status={item.status} />
                    )}
                 </div>
            </div>
        </div>
    );
};

const UploadModal: React.FC<UploadModalProps> = ({ onClose, setFiles, currentFolderId }) => {
    const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFilesSelected = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        const newUploadItems: UploadItem[] = Array.from(selectedFiles).map(file => ({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            file,
            status: 'pending',
            progress: 0,
            controller: new AbortController(),
        }));

        setUploadItems(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const uniqueNewItems = newUploadItems.filter(item => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
        });
    };

    const uploadFile = useCallback(async (item: UploadItem) => {
        setUploadItems(prev => prev.map(ui => ui.id === item.id ? { ...ui, status: 'uploading' } : ui));
        try {
            const newFile = await processSingleFileForUpload(item.file, currentFolderId,
                (progress) => {
                    setUploadItems(prev => prev.map(ui => ui.id === item.id ? { ...ui, progress } : ui));
                },
                item.controller.signal
            );
            setFiles(prev => [newFile, ...prev]);
            setUploadItems(prev => prev.map(ui => ui.id === item.id ? { ...ui, status: 'completed' } : ui));
        } catch (error: any) {
            if (error.name === 'AbortError') {
                setUploadItems(prev => prev.map(ui => ui.id === item.id ? { ...ui, status: 'cancelled' } : ui));
            } else {
                console.error("Upload failed for", item.file.name, error);
                const errorMessage = error.message || 'File read error';
                setUploadItems(prev => prev.map(ui => ui.id === item.id ? { ...ui, status: 'error', error: errorMessage } : ui));
            }
        }
    }, [currentFolderId, setFiles]);
    
    const handleUploadAll = useCallback(async () => {
        setIsUploading(true);
        const pendingItems = uploadItems.filter(item => item.status === 'pending');
        await Promise.all(pendingItems.map(item => uploadFile(item)));
        setIsUploading(false);
    }, [uploadItems, uploadFile]);

    const handleCancel = (itemId: string) => {
        const item = uploadItems.find(ui => ui.id === itemId);
        if (item && (item.status === 'pending' || item.status === 'uploading')) {
            item.controller.abort();
        }
    };
    
    const handleClearCompleted = () => {
        setUploadItems(prev => prev.filter(item => item.status === 'pending' || item.status === 'uploading'));
    };

    const overallProgress = useMemo(() => {
        if (uploadItems.length === 0) return 0;
        const totalProgress = uploadItems.reduce((sum, item) => sum + item.progress, 0);
        return totalProgress / uploadItems.length;
    }, [uploadItems]);

    const pendingCount = useMemo(() => uploadItems.filter(i => i.status === 'pending').length, [uploadItems]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4">Upload Files</h3>
                
                {uploadItems.length === 0 ? (
                    <div 
                        className="relative border-2 border-dashed border-border-color rounded-lg p-10 text-center cursor-pointer hover:border-primary transition-colors"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFilesSelected(e.target.files)} />
                        <p className="text-text-secondary">Drag & drop files here, or click to select</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-primary h-2.5 rounded-full" style={{width: `${overallProgress}%`}}></div></div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
                           {uploadItems.map(item => <UploadItemRow key={item.id} item={item} onCancel={() => handleCancel(item.id)} />)}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t">
                    <div>
                        {uploadItems.length > 0 && (
                             <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100 text-sm" onClick={() => fileInputRef.current?.click()}>Add More Files</button>
                        )}
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFilesSelected(e.target.files)} />
                    </div>
                    <div className="flex gap-3">
                         {uploadItems.some(i => i.status === 'completed' || i.status === 'cancelled' || i.status === 'error') &&
                            <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={handleClearCompleted}>Clear Completed</button>
                        }
                        <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={onClose}>Close</button>
                        <button 
                            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={isUploading || pendingCount === 0}
                            onClick={handleUploadAll}
                        >
                            {isUploading ? 'Uploading...' : `Upload ${pendingCount > 0 ? pendingCount : ''} File(s)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;