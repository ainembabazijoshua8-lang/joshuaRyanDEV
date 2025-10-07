
import React from 'react';
import { FileItem } from '../../types';
import { formatBytes } from '../../utils/fileUtils';

interface DetailsModalProps {
    file: FileItem;
    onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2">
        <dt className="font-medium text-text-secondary">{label}</dt>
        <dd className="col-span-2 text-text-primary">{value}</dd>
    </div>
);


const DetailsModal: React.FC<DetailsModalProps> = ({ file, onClose }) => {
    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4 border-b pb-3">File Details</h3>
                <dl className="divide-y divide-border-color">
                    <DetailRow label="Name" value={file.name} />
                    <DetailRow label="Type" value={file.type === 'folder' ? 'Folder' : 'File'} />
                    <DetailRow label="Size" value={file.type === 'folder' ? '—' : formatBytes(file.size)} />
                    <DetailRow label="Last Modified" value={new Date(file.lastModified).toLocaleString()} />
                </dl>
                <div className="flex justify-end mt-6">
                    <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
