
import React from 'react';

interface ConfirmDeleteModalProps {
    onClose: () => void;
    onConfirm: () => void;
    count: number;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onClose, onConfirm, count }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-2">Delete {count} Item(s)?</h3>
                <p className="text-text-secondary mb-6">This action is permanent and cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={onClose}>Cancel</button>
                    <button className="px-4 py-2 rounded-lg bg-danger text-white font-semibold hover:bg-red-700" onClick={onConfirm}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
