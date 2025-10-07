
import React from 'react';
import { ICONS } from '../constants';

export const getFileIcon = (name: string, type: 'file' | 'folder', sizeClass: string = 'h-10 w-10'): React.ReactElement => {
    if (type === 'folder') return React.cloneElement(ICONS.folder, { className: `${sizeClass} text-yellow-500` });
    
    const ext = name.split('.').pop()?.toLowerCase() || '';
    
    if (ext === 'pdf') return React.cloneElement(ICONS.pdf, { className: `${sizeClass} text-red-500` });
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return React.cloneElement(ICONS.image, { className: `${sizeClass} text-blue-500` });
    if (['txt', 'md', 'doc', 'docx'].includes(ext)) return React.cloneElement(ICONS.text, { className: `${sizeClass} text-gray-600` });
    
    return React.cloneElement(ICONS.file, { className: `${sizeClass} text-gray-400` });
};

export const isEditable = (name: string): boolean => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['txt', 'md'].includes(ext);
};

export const isPdf = (name: string): boolean => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ext === 'pdf';
};

export const isImage = (name: string): boolean => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
