
import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types';

interface FileNameEditorProps {
    file: FileItem;
    onRename: (fileId: number, newName: string) => void;
    onCancel: () => void;
    className?: string;
}

const FileNameEditor: React.FC<FileNameEditorProps> = ({ file, onRename, onCancel, className }) => {
    const [name, setName] = useState(file.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            const extIndex = file.name.lastIndexOf('.');
            // Select only the base name if there's an extension and it's not the first character
            if (extIndex > 0 && extIndex < file.name.length -1) {
                inputRef.current.setSelectionRange(0, extIndex);
            } else {
                inputRef.current.select();
            }
        }
    }, [file.name]);

    const handleSave = () => {
        const trimmedName = name.trim();
        if (trimmedName && trimmedName !== file.name) {
            onRename(file.id, trimmedName);
        } else {
            onCancel(); // Cancel if name is empty or unchanged
        }
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