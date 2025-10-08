import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types.ts';

interface FileNameEditorProps {
    file: FileItem;
    allFiles: FileItem[];
    onRename: (fileId: number, newName: string) => void;
    onCancel: () => void;
    className?: string;
}

const FileNameEditor: React.FC<FileNameEditorProps> = ({ file, allFiles, onRename, onCancel, className }) => {
    const [name, setName] = useState(file.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            const extIndex = file.name.lastIndexOf('.');
            // Select only the base name if there's an extension and it's not the first character
            if (file.type === 'file' && extIndex > 0 && extIndex < file.name.length -1) {
                inputRef.current.setSelectionRange(0, extIndex);
            } else {
                inputRef.current.select();
            }
        }
    }, [file.name, file.type]);

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName === file.name) {
            onCancel(); // Cancel if name is empty or unchanged
            return;
        }

        const nameExists = allFiles.some(f =>
            f.id !== file.id &&
            f.parentId === file.parentId &&
            f.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (nameExists) {
            // In a real app, you might show an error. For now, we just cancel.
            alert('A file with this name already exists in this folder.');
            onCancel();
            return;
        }
        
        onRename(file.id, trimmedName);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleBlur = () => {
        handleSave();
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to parent item
            className={`text-sm font-medium text-text-primary bg-white border border-primary ring-1 ring-primary rounded-md w-full px-1 py-0.5 outline-none ${className}`}
        />
    );
};

export default FileNameEditor;