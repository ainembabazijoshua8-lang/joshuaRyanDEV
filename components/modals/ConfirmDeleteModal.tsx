import React from 'react';

interface ConfirmActionModalProps {
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText: string;
    confirmClass?: string;
    showCancelButton?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmActionModalProps> = ({
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    confirmClass = 'bg-primary hover:bg-blue-700',
    showCancelButton = true,
}) => {
    
    const handleConfirm = () => {
        onConfirm();
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-text-secondary mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    {showCancelButton && (
                         <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={onClose}>Cancel</button>
                    )}
                    <button 
                        className={`px-4 py-2 rounded-lg text-white font-semibold ${confirmClass}`} 
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;