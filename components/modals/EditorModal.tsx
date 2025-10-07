
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
    const [editorContent, setEditorContent] = useState(file.content || '');
    const [pdfState, setPdfState] = useState({ currentPage: 1, totalPages: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const renderPdfPage = useCallback((pageNum: number) => {
        if (!pdfDocRef.current || !canvasRef.current) return;
        pdfDocRef.current.getPage(pageNum).then((page: any) => {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current!;
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            page.render({ canvasContext: context, viewport: viewport });
            setPdfState(s => ({ ...s, currentPage: pageNum }));
        });
    }, []);

    useEffect(() => {
        if (isPdf(file.name) && file.url) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://mozilla.github.io/pdf.js/build/pdf.worker.js`;
            pdfjsLib.getDocument(file.url).promise.then((pdf: any) => {
                pdfDocRef.current = pdf;
                setPdfState({ currentPage: 1, totalPages: pdf.numPages });
                renderPdfPage(1);
            });
        } else if (isEditable(file.name)) {
            const editorElement = document.getElementById('quill-editor');
            if (editorElement && !quillRef.current) {
                 quillRef.current = new Quill(editorElement, { theme: 'snow' });
                 quillRef.current.root.innerHTML = file.content || '';
                 quillRef.current.on('text-change', () => {
                     setEditorContent(quillRef.current.root.innerHTML);
                 });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, renderPdfPage]);

    const handleSave = () => {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, content: editorContent, lastModified: Date.now() } : f));
        onClose();
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
                             <div className="sticky top-0 z-10 inline-flex items-center gap-4 bg-gray-900/80 text-white rounded-lg px-4 py-2 mb-4">
                                <button onClick={() => renderPdfPage(pdfState.currentPage - 1)} disabled={pdfState.currentPage <= 1} className="disabled:opacity-50">Prev</button>
                                <span>{pdfState.currentPage} / {pdfState.totalPages}</span>
                                <button onClick={() => renderPdfPage(pdfState.currentPage + 1)} disabled={pdfState.currentPage >= pdfState.totalPages} className="disabled:opacity-50">Next</button>
                            </div>
                            <canvas ref={canvasRef}></canvas>
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
