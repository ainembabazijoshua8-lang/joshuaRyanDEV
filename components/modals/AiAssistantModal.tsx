
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types.ts';

interface AiAssistantModalProps {
    onClose: () => void;
    history: ChatMessage[];
    onPrompt: (prompt: string) => void;
    isProcessing?: boolean;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose, history, onPrompt, isProcessing }) => {
    const [prompt, setPrompt] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isProcessing) {
            onPrompt(prompt.trim());
            setPrompt('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                         <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v1.5a1.5 1.5 0 01-3 0V7a1 1 0 00-1-1H7a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /><path d="M10 12.5a1.5 1.5 0 013 0V13a1 1 0 001 1h3a1 1 0 011 1v1.5a1.5 1.5 0 01-3 0V16a1 1 0 00-1-1H7a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V16a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>
                        AI Assistant
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                         <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-text-primary'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                     {isProcessing && (
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
                
                <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
                    <div className="relative">
                        <input
                            type="text"
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="e.g., 'find all reports from last month and move them to an Archive folder'"
                            className="w-full pr-12 py-2 pl-4 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isProcessing}
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-blue-700 disabled:opacity-50" disabled={!prompt.trim() || isProcessing}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AiAssistantModal;
