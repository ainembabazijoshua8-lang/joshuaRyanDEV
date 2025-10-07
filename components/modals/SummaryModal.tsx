
import React, { useState, useEffect } from 'react';
import { FileItem } from '../../types';
import { summarizeContent } from '../../services/geminiService';

interface SummaryModalProps {
    file: FileItem;
    onClose: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ file, onClose }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const generateSummary = async () => {
            const latestContent = (file.versions && file.versions.length > 0) ? file.versions[0].content : null;

            if (!latestContent) {
                setError('File has no content to summarize.');
                setIsLoading(false);
                return;
            }
            try {
                const result = await summarizeContent(latestContent);
                setSummary(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        generateSummary();
    }, [file]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                     <h3 className="text-xl font-semibold flex items-center gap-2">
                        <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v1.5a1.5 1.5 0 01-3 0V7a1 1 0 00-1-1H7a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /><path d="M10 12.5a1.5 1.5 0 013 0V13a1 1 0 001 1h3a1 1 0 011 1v1.5a1.5 1.5 0 01-3 0V16a1 1 0 00-1-1H7a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V16a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>
                        AI Summary of <span className="italic truncate max-w-xs">{file.name}</span>
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                         <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
               
                <div className="overflow-y-auto pr-2">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-8">
                            <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-text-secondary">Generating summary...</p>
                        </div>
                    )}
                    {error && <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>}
                    {!isLoading && !error && (
                        <p className="text-text-primary whitespace-pre-wrap leading-relaxed">{summary}</p>
                    )}
                </div>
                 <div className="flex justify-end mt-6 pt-4 border-t">
                    <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryModal;
