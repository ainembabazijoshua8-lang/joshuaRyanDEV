
import React, { useState, useEffect, useRef } from 'react';
import { FileItem, ChatMessage } from '../../types';
import { isImage, isPdf, isEditable, formatBytes } from '../../utils/fileUtils';
import { ICONS } from '../../constants';
import { chatWithDocument } from '../../services/geminiService';

interface EditorModalProps {
    file: FileItem;
    onClose: () => void;
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}

const EditorModal: React.FC<EditorModalProps> = ({ file, onClose, setFiles }) => {
    const initialContent = (file.versions && file.versions.length > 0) ? file.versions[0].content : '';
    const [content, setContent] = useState(initialContent);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userQuestion, setUserQuestion] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [documentTextContent, setDocumentTextContent] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(true);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [previewContent, setPreviewContent] = useState<string | null>(null);

    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const isDirty = content !== initialContent;
    const isPreviewingVersion = previewContent !== null;

    // Extract text from file for AI Chat from latest version
    useEffect(() => {
        if (isEditable(file.name)) {
            setDocumentTextContent(initialContent);
        } else if (isPdf(file.name) && file.url) {
            const extractText = async () => {
                try {
                    const pdf = await (window as any).pdfjsLib.getDocument(file.url).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map((item: any) => item.str).join(' ');
                        fullText += '\n';
                    }
                    setDocumentTextContent(fullText);
                } catch (error) {
                    console.error('Error extracting PDF text:', error);
                    setDocumentTextContent('Could not extract text from this PDF for chat.');
                }
            };
            extractText();
        } else {
            setDocumentTextContent(null);
        }
    }, [file, initialContent]);
    
    // Render PDF to canvas
    useEffect(() => {
        if (isPdf(file.name) && file.url && pdfCanvasRef.current) {
            let isCancelled = false;
            const renderPdf = async () => {
                setIsPdfLoading(true);
                try {
                    const pdf = await (window as any).pdfjsLib.getDocument(file.url).promise;
                    if (isCancelled) return;
                    const page = await pdf.getPage(1);
                    if (isCancelled) return;
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = pdfCanvasRef.current;
                    if (canvas) {
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        const context = canvas.getContext('2d');
                        if (context) await page.render({ canvasContext: context, viewport }).promise;
                    }
                } catch (error) {
                    console.error("Failed to render PDF", error);
                } finally {
                    if (!isCancelled) setIsPdfLoading(false);
                }
            };
            renderPdf();
            return () => { isCancelled = true; };
        }
    }, [file]);

    useEffect(() => { chatBodyRef.current?.scrollTo(0, chatBodyRef.current.scrollHeight); }, [chatHistory]);

    const handleSave = () => {
        if (!isEditable(file.name) || !isDirty) return;
        const newVersion = { timestamp: Date.now(), content };
        const newVersions = [newVersion, ...(file.versions || [])];
        setFiles(p => p.map(f => f.id === file.id ? { ...f, versions: newVersions, lastModified: newVersion.timestamp } : f));
        onClose();
    };
    
    const handleRestoreVersion = (versionContent: string) => {
        const newVersion = { timestamp: Date.now(), content: versionContent };
        const newVersions = [newVersion, ...(file.versions || [])];
        setFiles(p => p.map(f => f.id === file.id ? { ...f, versions: newVersions, lastModified: newVersion.timestamp } : f));
        setContent(versionContent);
        setPreviewContent(null);
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userQuestion.trim() || isChatLoading || !documentTextContent) return;
        const newUserMessage: ChatMessage = { role: 'user', content: userQuestion.trim() };
        setChatHistory(prev => [...prev, newUserMessage]);
        setIsChatLoading(true);
        setUserQuestion('');
        try {
            const answer = await chatWithDocument(documentTextContent, userQuestion.trim(), chatHistory);
            setChatHistory(prev => [...prev, { role: 'model', content: answer }]);
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred.';
            setChatHistory(prev => [...prev, { role: 'model', content: `Sorry, error: ${errMsg}` }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const canChat = documentTextContent !== null;

    const renderContent = () => {
        if (isImage(file.name) && file.url) return <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain" />;
        if (isPdf(file.name)) {
            return (
                <div className="relative">{isPdfLoading && <div className="absolute inset-0 flex items-center justify-center bg-gray-100"><div className="text-text-secondary">Loading PDF...</div></div>}
                    <canvas ref={pdfCanvasRef} className={isPdfLoading ? 'opacity-0' : 'opacity-100'} />
                </div>
            );
        }
        if (isEditable(file.name)) return <textarea value={isPreviewingVersion ? previewContent : content} onChange={e => setContent(e.target.value)} readOnly={isPreviewingVersion} className="w-full h-full font-mono text-sm p-4 border rounded-lg focus:ring-primary focus:border-primary resize-none disabled:bg-gray-50" />;
        return <div className="flex flex-col justify-center items-center h-full"><div className="w-24 h-24 text-gray-400">{ICONS.file}</div><p className="mt-4 text-text-secondary">Preview not available.</p><p className="text-sm text-gray-400">{formatBytes(file.size)}</p></div>;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] p-4 flex flex-col modal-content" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center border-b pb-3 mb-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold truncate pr-4">{file.name}{isDirty && !isPreviewingVersion && '*'}</h3>
                    <div className="flex items-center gap-4">
                        {isEditable(file.name) && <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="px-4 py-2 rounded-lg font-semibold border hover:bg-gray-100 flex items-center gap-2">Version History</button>}
                        {canChat && <button onClick={() => setIsChatVisible(!isChatVisible)} className="px-4 py-2 rounded-lg font-semibold border hover:bg-gray-100 flex items-center gap-2">{isChatVisible ? 'Hide Chat' : 'AI Chat'}</button>}
                        {isEditable(file.name) && <button onClick={handleSave} disabled={!isDirty || isPreviewingVersion} className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${isDirty && !isPreviewingVersion ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary/50 cursor-not-allowed'}`}>Save & Close</button>}
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                </header>
                <main className="flex-grow overflow-hidden flex gap-4">
                    <div className="flex-grow h-full overflow-auto bg-gray-100 rounded-lg p-2 flex justify-center items-start relative">{isPreviewingVersion && <div className="absolute top-2 left-2 z-10 bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">Previewing an older version. <button className="font-bold underline ml-2" onClick={() => setPreviewContent(null)}>Exit Preview</button></div>}{renderContent()}</div>
                    {isHistoryVisible && (
                        <div className="w-80 flex-shrink-0 flex flex-col border rounded-lg">
                            <h4 className="p-4 border-b font-semibold text-center">Version History</h4>
                            <ul className="flex-grow p-2 space-y-1 overflow-y-auto">
                                {file.versions?.map((v, i) => (
                                    <li key={v.timestamp} className="p-2 rounded hover:bg-gray-100">
                                        <div className="font-medium text-sm text-text-primary">{new Date(v.timestamp).toLocaleString()} {i === 0 && <span className="text-xs font-bold text-green-600 ml-2">Current</span>}</div>
                                        <div className="text-xs text-text-secondary mt-2 flex gap-2">
                                            <button onClick={() => setPreviewContent(v.content)} className="font-semibold text-blue-600 hover:underline">Preview</button>
                                            <button onClick={() => handleRestoreVersion(v.content)} className="font-semibold text-blue-600 hover:underline">Restore</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {isChatVisible && !isHistoryVisible && (
                        <div className="w-96 flex-shrink-0 flex flex-col border rounded-lg">
                            <div ref={chatBodyRef} className="flex-grow p-4 space-y-4 overflow-y-auto">{chatHistory.length === 0 && <div className="text-center text-sm text-text-secondary pt-10">Ask a question about the document to start the chat.</div>}{chatHistory.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-text-primary'}`}><p className="whitespace-pre-wrap">{msg.content}</p></div></div>))}{isChatLoading && <div className="flex justify-start"><div className="px-4 py-2 rounded-2xl bg-gray-200 text-text-primary">Thinking...</div></div>}</div>
                            <form onSubmit={handleChatSubmit} className="p-4 border-t flex gap-2"><input type="text" value={userQuestion} onChange={e => setUserQuestion(e.target.value)} placeholder="Ask a question..." className="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /><button type="submit" disabled={isChatLoading} className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 disabled:opacity-50">Send</button></form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default EditorModal;