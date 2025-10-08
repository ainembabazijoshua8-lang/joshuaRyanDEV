import React, { useRef, useEffect, useState } from 'react';
import { FileItem } from '../types.ts';
import { formatBytes, isImage, isEditable } from '../utils/fileUtils.ts';
import { ICONS } from '../constants.tsx';

// pdf.js is loaded from a CDN in index.html and attaches pdfjsLib to the window object.
declare const pdfjsLib: any;

interface PdfPreviewProps {
    url: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ url }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pdfDoc = useRef<any>(null);

    useEffect(() => {
        if (!url) return;
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://mozilla.github.io/pdf.js/build/pdf.worker.js`;
        let isCancelled = false;
        let loadingTask: any = null;

        const loadPdf = async () => {
            setLoading(true);
            setError('');
            try {
                loadingTask = pdfjsLib.getDocument(url);
                const doc = await loadingTask.promise;
                if (isCancelled) return;
                pdfDoc.current = doc;
                setNumPages(doc.numPages);
                setCurrentPage(1); // Reset to first page on new URL
            } catch (err: any) {
                if (isCancelled) return;
                console.error('Error loading PDF document:', err);
                setError(err.message || 'Failed to load PDF document.');
                setLoading(false);
            }
        };

        loadPdf();
        
        return () => { 
            isCancelled = true;
            if (pdfDoc.current) {
                pdfDoc.current.destroy();
                pdfDoc.current = null;
            }
            if (loadingTask) {
                loadingTask.destroy();
            }
        }

    }, [url]);

    useEffect(() => {
        if (!pdfDoc.current || !canvasRef.current) return;

        let isCancelled = false;
        const renderPage = async () => {
            setLoading(true);
            try {
                const page = await pdfDoc.current.getPage(currentPage);
                const canvas = canvasRef.current;
                if (!canvas) return;

                const viewport = page.getViewport({ scale: 1.5 });
                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext).promise;
                if (isCancelled) return;
                setLoading(false);
            } catch (err) {
                 if (isCancelled) return;
                 console.error('Error rendering PDF page:', err);
                 setError('Failed to render PDF page.');
                 setLoading(false);
            }
        };

        renderPage();

        return () => {
            isCancelled = true;
        };

    }, [currentPage, pdfDoc.current]);

    const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(numPages, prev + 1));


    return (
        <div className="bg-gray-100 p-2 rounded-lg max-h-96 flex flex-col items-center justify-center">
            {error && <p className="text-sm text-danger p-4">{error}</p>}
            <div className={`overflow-auto flex-1 ${error ? 'hidden' : ''}`}>
                 <canvas ref={canvasRef} className={`${loading ? 'hidden' : ''}`}></canvas>
                 {loading && !error && <p className="text-sm text-text-secondary p-4">Loading PDF preview...</p>}
            </div>
            {numPages > 1 && !error && (
                <div className="flex items-center justify-center gap-4 pt-2 mt-2 border-t w-full text-sm">
                    <button onClick={goToPrevPage} disabled={currentPage <= 1} className="disabled:opacity-50 px-2 py-1 rounded hover:bg-gray-200">Prev</button>
                    <span>{currentPage} / {numPages}</span>
                    <button onClick={goToNextPage} disabled={currentPage >= numPages} className="disabled:opacity-50 px-2 py-1 rounded hover:bg-gray-200">Next</button>
                </div>
            )}
        </div>
    );
};


interface PreviewSidebarProps {
    file: FileItem | null;
    onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="text-sm text-text-primary break-words">{value}</p>
    </div>
);

const PreviewSidebar: React.FC<PreviewSidebarProps> = ({ file, onClose }) => {
    if (!file) return null;

    const renderPreview = () => {
        if (isImage(file.name) && file.url) {
            return <img src={file.url} alt={file.name} className="w-full h-auto rounded-lg object-contain max-h-64" />;
        }
         if (file.name.toLowerCase().endsWith('.pdf') && file.url) {
            return <PdfPreview url={file.url} />;
        }
        if (isEditable(file.name) && file.versions && file.versions.length > 0) {
            return (
                <div className="bg-gray-100 p-3 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{file.versions[0].content.substring(0, 1000)}</pre>
                </div>
            );
        }
        return (
            <div className="bg-gray-100 rounded-lg flex flex-col items-center justify-center h-48">
                <div className="w-24 h-24 text-gray-300">
                    {file.type === 'folder' ? ICONS.folder : ICONS.file}
                </div>
                <p className="mt-2 text-text-secondary">No preview available</p>
            </div>
        );
    };

    return (
        <aside className="w-80 bg-white border-l border-border-color p-6 flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Preview</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                    {ICONS.close}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 mb-3">{file.type === 'folder' ? ICONS.folder : ICONS.file}</div>
                    <p className="font-semibold break-words w-full">{file.name}</p>
                </div>
                
                {renderPreview()}

                <div>
                    <h4 className="font-semibold mb-3">Details</h4>
                    <div className="space-y-3">
                        <DetailRow label="Type" value={file.type === 'folder' ? 'Folder' : 'File'} />
                        <DetailRow label="Size" value={file.type === 'folder' ? '—' : formatBytes(file.size)} />
                        <DetailRow label="Last Modified" value={new Date(file.lastModified).toLocaleString()} />
                        {file.trashedOn && <DetailRow label="Trashed On" value={new Date(file.trashedOn).toLocaleString()} />}
                    </div>
                </div>

                {file.tags && file.tags.length > 0 && (
                     <div>
                        <h4 className="font-semibold mb-3">AI Tags</h4>
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