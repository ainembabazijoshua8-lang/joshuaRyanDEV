import React, { useState, useRef, useEffect } from 'react';
import { FileItem, ChatMessage, ModalState } from '../../types.ts';
import { chatWithDocument } from '../../services/geminiService.ts';

interface EditorModalProps {
    file: FileItem;
    setModalState: (state: ModalState) => void;
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}

const MAX_EDITABLE_CONTENT_LENGTH = 1 * 1024 * 1024; // 1MB

const EditorModal: React.FC<EditorModalProps> = ({ file, setModalState, setFiles }) => {
    const latestVersion = file.versions?.[0];
    const [content, setContent] = useState(latestVersion?.content || '');
    const [isDirty, setIsDirty] = useState(false);
    const isTooLargeForEditing = (latestVersion?.content?.length || 0) > MAX_EDITABLE_CONTENT_LENGTH;

    // AI Chat state
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [question, setQuestion] = useState('');
    const [isAnswering, setIsAnswering] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSave = () => {
        if (!isDirty || isTooLargeForEditing) return;
        const newVersion = { timestamp: Date.now(), content };
        const newVersions = [newVersion, ...(file.versions || [])].slice(0, 10); // Keep last 10 versions
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, versions: newVersions, lastModified: Date.now(), size: content.length } : f));
        setIsDirty(false);
    };

    const handleCloseAttempt = () => {
        if (isDirty && !isTooLargeForEditing) {
            setModalState({
                type: 'confirmAction',
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Are you sure you want to close without saving?',
                confirmText: 'Close Without Saving',
                confirmClass: 'bg-danger hover:bg-red-700',
                onConfirm: () => setModalState(null),
            });
        } else {
            setModalState(null);
        }
    };

    const handleSaveAndClose = () => {
        if (!isTooLargeForEditing) {
            handleSave();
        }
        setModalState(null);
    };
    
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setIsDirty(true);
    };

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isAnswering || isTooLargeForEditing) return;

        const userMessage: ChatMessage = { role: 'user', content: question };
        setChatHistory(prev => [...prev, userMessage]);
        const currentQuestion = question;
        setQuestion('');
        setIsAnswering(true);

        try {
            const answer = await chatWithDocument(content, currentQuestion, chatHistory.slice(0, -1)); // Exclude current question from history
            if (isMounted.current) {
                const modelMessage: ChatMessage = { role: 'model', content: answer };
                setChatHistory(prev => [...prev, modelMessage]);
            }
        } catch (error) {
            if (isMounted.current) {
                const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I couldn't get an answer. Please try again." };
                setChatHistory(prev => [...prev, errorMessage]);
            }
        } finally {
            if (isMounted.current) {
                setIsAnswering(false);
            }
        }
    };


    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 md:p-8" onClick={handleCloseAttempt}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                {/* Editor Pane */}
                <div className="flex-1 flex flex-col p-6">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-3 truncate">
                        Editing: <span className="italic">{file.name}</span>
                        {isDirty && !isTooLargeForEditing && <span className="text-sm font-normal text-yellow-600 ml-2">(unsaved changes)</span>}
                    </h3>
                    {isTooLargeForEditing ? (
                        <div className="w-full h-full flex-1 p-4 border rounded-md flex items-center justify-center text-center bg-gray-50">
                            <div>
                                <h4 className="font-semibold text-lg text-text-primary">File is Too Large</h4>
                                <p className="text-text-secondary mt-2">
                                    This file is larger than 1MB and cannot be edited or viewed in the browser.
                                    <br />
                                    Please download it to make changes.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <textarea
                            value={content}
                            onChange={handleContentChange}
                            className="w-full h-full flex-1 p-4 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Start typing..."
                        />
                    )}
                     <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                        <button className="px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-100" onClick={handleCloseAttempt}>
                             {isDirty && !isTooLargeForEditing ? 'Close Without Saving' : 'Close'}
                        </button>
                        {!isTooLargeForEditing && (
                            <>
                                <button 
                                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50" 
                                    onClick={handleSave}
                                    disabled={!isDirty}
                                >
                                    Save
                                </button>
                                 <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700" onClick={handleSaveAndClose}>
                                    Save & Close
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* AI Chat Pane */}
                <div className="w-full md:w-1/3 bg-gray-50 border-l flex flex-col">
                    <h4 className="p-4 font-semibold text-lg border-b text-primary flex-shrink-0">Ask about this document</h4>
                     {isTooLargeForEditing ? (
                        <div className="flex-1 p-4 flex items-center justify-center text-center">
                            <p className="text-text-secondary">AI analysis is unavailable for files larger than 1MB.</p>
                        </div>
                    ) : (
                        <>
                            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                                {chatHistory.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs md:max-w-sm lg:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-text-primary'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isAnswering && (
                                     <div className="flex justify-start">
                                        <div className="max-w-xs p-3 rounded-lg bg-gray-200 text-text-primary">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.1s]"></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleAskQuestion} className="p-4 border-t bg-white flex-shrink-0">
                                <div className="relative">
                                     <input
                                        type="text"
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        placeholder="e.g., summarize the main points"
                                        className="w-full pr-12 py-2 pl-4 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={isAnswering}
                                    />
                                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-blue-700 disabled:opacity-50" disabled={!question.trim() || isAnswering}>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorModal;