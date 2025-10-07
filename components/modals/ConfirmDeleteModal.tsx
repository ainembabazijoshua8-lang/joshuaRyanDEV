import React from 'react';

interface ConfirmDeleteModalProps {
    onClose: () => void;
    onConfirm: () => void;
    count: number;
    isPermanent: boolean;
    isEmptyingAll?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onClose, onConfirm, count, isPermanent, isEmptyingAll }) => {
    const title = isEmptyingAll 
        ? 'Empty Trash?' 
        : `Permanently delete ${count} item(s)?`;
    
    const message = "This action is permanent and cannot be undone.";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                {isPermanent && <p className="text-text-secondary mb-6">{message}</p>}
                <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={onClose}>Cancel</button>
                    <button className="px-4 py-2 rounded-lg bg-danger text-white font-semibold hover:bg-red-700" onClick={onConfirm}>
                        {isEmptyingAll ? 'Empty Trash' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;