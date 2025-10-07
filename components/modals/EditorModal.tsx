import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FileItem } from '../../types';
import { isEditable, isPdf, isImage } from '../../utils/fileUtils';

// Forward declaration for pdfjsLib from CDN
declare const pdfjsLib: any;
declare const Quill: any;

interface EditorModalProps {
    file: FileItem;
    onClose: () => void;
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}

const EditorModal: React.FC<EditorModalProps> = ({ file, onClose, setFiles }) => {
    const quillRef = useRef<any>(null);
    const pdfDocRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [editorContent, setEditorContent] = useState(file.content || '');
    const [pdfState, setPdfState] = useState({ currentPage: 1, totalPages: 0, error: '', isLoading: true });

    const renderPdfPage = useCallback(async (pageNum: number, pdfDoc: any, signal: { aborted: boolean }) => {
        try {
            const page = await pdfDoc.getPage(pageNum);
            if (signal.aborted || !canvasRef.current) return;

            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
            }
            
            if (signal.aborted) return;
            setPdfState(s => ({ ...s, currentPage: pageNum }));

        } catch (err) {
            if (signal.aborted) return;
            console.error("Error rendering PDF page:", err);
            setPdfState(s => ({ ...s, error: 'Failed to render page.', isLoading: false }));
        }
    }, []);

    useEffect(() => {
        const abortController = { aborted: false };
        let quillHandler: (() => void) | null = null;
        let quillInstance: any = null;

        if (isPdf(file.name) && file.url) {
            setPdfState({ currentPage: 1, totalPages: 0, error: '', isLoading: true });
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://mozilla.github.io/pdf.js/build/pdf.worker.js`;
            
            pdfjsLib.getDocument(file.url).promise.then((pdf: any) => {
                if (abortController.aborted) return;
                pdfDocRef.current = pdf;
                setPdfState(s => ({ ...s, totalPages: pdf.numPages, isLoading: false }));
                renderPdfPage(1, pdf, abortController);
            }).catch((err: Error) => {
                if (abortController.aborted) return;
                console.error("Error loading PDF:", err);
                setPdfState(s => ({ ...s, error: 'Failed to load PDF file.', isLoading: false }));
            });

        } else if (isEditable(file.name)) {
            const editorElement = document.getElementById('quill-editor');
            if (editorElement) {
                quillInstance = new Quill(editorElement, { theme: 'snow' });
                quillRef.current = quillInstance;
                quillInstance.root.innerHTML = file.content || '';
                 
                quillHandler = () => {
                     if (quillInstance) {
                        setEditorContent(quillInstance.root.innerHTML);
                     }
                };
                quillInstance.on('text-change', quillHandler);
            }
        }
        
        return () => {
            abortController.aborted = true;
            if (quillInstance && quillHandler) {
                quillInstance.off('text-change', quillHandler);
            }
            quillRef.current = null;
        };
    }, [file, renderPdfPage]);

    const handleSave = () => {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, content: editorContent, lastModified: Date.now() } : f));
        onClose();
    };

    const handlePdfNav = (direction: 'next' | 'prev') => {
        if (!pdfDocRef.current) return;
        const newPage = direction === 'next' ? pdfState.currentPage + 1 : pdfState.currentPage - 1;
        if (newPage > 0 && newPage <= pdfState.totalPages) {
            // Pass a new, non-aborted signal for the new render operation
            renderPdfPage(newPage, pdfDocRef.current, { aborted: false });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-border-color flex-shrink-0">
                    <h3 className="text-lg font-semibold truncate pr-4">{file.name}</h3>
                    <div>
                        {isEditable(file.name) && (
                            <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700" onClick={handleSave}>
                                Save & Close
                            </button>
                        )}
                        {!isEditable(file.name) && (
                             <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={onClose}>
                                Close
                            </button>
                        )}
                    </div>
                </header>
                <div className="flex-grow overflow-hidden relative">
                    {isEditable(file.name) && <div id="quill-editor" className="h-full"></div>}
                    {isPdf(file.name) && (
                        <div className="h-full overflow-auto bg-gray-800 text-center p-4">
                             {pdfState.isLoading && (
                                <div className="flex items-center justify-center h-full text-white font-semibold">Loading PDF...</div>
                             )}
                             {pdfState.error && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                        <strong className="font-bold">Error: </strong>
                                        <span className="block sm:inline">{pdfState.error}</span>
                                    </div>
                                </div>
                             )}
                             {!pdfState.isLoading && !pdfState.error && pdfState.totalPages > 0 && (
                                <>
                                    <div className="sticky top-0 z-10 inline-flex items-center gap-4 bg-gray-900/80 text-white rounded-lg px-4 py-2 mb-4">
                                        <button onClick={() => handlePdfNav('prev')} disabled={pdfState.currentPage <= 1} className="disabled:opacity-50">Prev</button>
                                        <span>{pdfState.currentPage} / {pdfState.totalPages}</span>
                                        <button onClick={() => handlePdfNav('next')} disabled={pdfState.currentPage >= pdfState.totalPages} className="disabled:opacity-50">Next</button>
                                    </div>
                                    <canvas ref={canvasRef}></canvas>
                                </>
                             )}
                        </div>
                    )}
                    {isImage(file.name) && (
                        <div className="h-full bg-gray-900 flex justify-center items-center p-4">
                            <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorModal;