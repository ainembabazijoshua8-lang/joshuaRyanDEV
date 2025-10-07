
import React from 'react';
import { FileItem } from '../types';
import { ICONS } from '../constants';
import { isImage, formatBytes, getFileExtension, isEditable } from '../utils/fileUtils';

interface PreviewSidebarProps {
    file: FileItem;
    onClose: () => void;
}

const PreviewSidebar: React.FC<PreviewSidebarProps> = ({ file, onClose }) => {
    const getIcon = () => {
        if (file.type === 'folder') return ICONS.folder;
        const ext = getFileExtension(file.name);
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return ICONS.image;
        if (ext === 'pdf') return ICONS.pdf;
        if (['txt', 'md', 'json', 'html', 'css', 'js', 'ts'].includes(ext)) return ICONS.text;
        return ICONS.file;
    };
    
    const icon = getIcon();
    
    return (
        <aside className="preview-sidebar w-80 bg-white border-l border-border-color p-4 flex-shrink-0 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Preview</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close preview">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {isImage(file.name) && file.url ? (
                        <img src={file.url} alt={file.name} className="object-contain max-w-full max-h-full" />
                    ) : (
                        <div className="w-24 h-24">{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-24 h-24' }) : icon}</div>
                    )}
                </div>
                
                 {isEditable(file.name) && file.versions && file.versions.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md max-h-40 overflow-y-auto">
                        <p className="text-xs text-text-secondary whitespace-pre-wrap font-mono">{file.versions[0].content.substring(0, 300)}...</p>
                    </div>
                 )}

                <h4 className="font-semibold break-words mb-4">{file.name}</h4>

                <dl className="text-sm space-y-3">
                    <div className="flex justify-between">
                        <dt className="text-text-secondary">Type</dt>
                        <dd>{file.type === 'folder' ? 'Folder' : `File (${getFileExtension(file.name).toUpperCase()})`}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-text-secondary">Size</dt>
                        <dd>{file.type === 'folder' ? '—' : formatBytes(file.size)}</dd>
                    </div>
                     <div className="flex justify-between">
                        <dt className="text-text-secondary">Modified</dt>
                        <dd>{new Date(file.lastModified).toLocaleDateString()}</dd>
                    </div>
                </dl>
                
                {file.tags && file.tags.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-color">
                        <h5 className="font-semibold mb-2">AI Tags</h5>
                        <div className="flex flex-wrap gap-2">
                            {file.tags.map(tag => (
                                <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default PreviewSidebar;
