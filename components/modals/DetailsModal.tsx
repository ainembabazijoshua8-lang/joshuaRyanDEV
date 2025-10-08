
import React, { useMemo } from 'react';
import { FileItem } from '../../types.ts';
import { formatBytes } from '../../utils/fileUtils.ts';

interface DetailsModalProps {
    files: FileItem[];
    onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-3">
        <dt className="font-medium text-text-secondary">{label}</dt>
        <dd className="col-span-2 text-text-primary break-words">{value}</dd>
    </div>
);


const DetailsModal: React.FC<DetailsModalProps> = ({ files, onClose }) => {
    
    const singleFile = files.length === 1 ? files[0] : null;

    const multiFileStats = useMemo(() => {
        if (files.length <= 1) return null;
        const totalSize = files.reduce((acc, file) => file.type === 'file' ? acc + file.size : acc, 0);
        const folderCount = files.filter(f => f.type === 'folder').length;
        const fileCount = files.length - folderCount;
        return { totalSize, folderCount, fileCount };
    }, [files]);
    
    if (files.length === 0) return null;

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4 border-b pb-3 flex-shrink-0">
                    {singleFile ? 'File Details' : `Details for ${files.length} items`}
                </h3>

                <div className="overflow-y-auto pr-2">
                    {singleFile ? (
                        <dl className="divide-y divide-border-color">
                            <DetailRow label="Name" value={singleFile.name} />
                            <DetailRow label="Type" value={singleFile.type === 'folder' ? 'Folder' : 'File'} />
                            <DetailRow label="Size" value={singleFile.type === 'folder' ? '—' : formatBytes(singleFile.size)} />
                            <DetailRow label="Last Modified" value={new Date(singleFile.lastModified).toLocaleString()} />
                            {singleFile.tags && singleFile.tags.length > 0 && (
                                <div className="py-3">
                                    <dt className="font-medium text-text-secondary mb-2">AI Tags</dt>
                                    <dd className="flex flex-wrap gap-2">
                                        {singleFile.tags.map(tag => (
                                            <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    ) : multiFileStats ? (
                        <div>
                             <dl className="divide-y divide-border-color">
                                <DetailRow label="Total Size" value={formatBytes(multiFileStats.totalSize)} />
                                <DetailRow label="Contains" value={`${multiFileStats.fileCount} files, ${multiFileStats.folderCount} folders`} />
                            </dl>
                            <div className="mt-4 pt-4 border-t border-border-color">
                                <h4 className="font-medium text-text-secondary mb-3">Selected Items</h4>
                                <ul className="text-sm space-y-1 max-h-48 overflow-y-auto bg-gray-50 p-2 rounded-md">
                                    {files.map(f => <li key={f.id} className="truncate">{f.name}</li>)}
                                </ul>
                            </div>
                        </div>
                    ) : null}
                </div>
                
                <div className="flex justify-end mt-6 pt-3 border-t flex-shrink-0">
                    <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
