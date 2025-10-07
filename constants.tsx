
import React from 'react';
import { FileItem } from './types';

export const initialFiles: FileItem[] = [
    { id: 1, name: 'Project Brief.pdf', type: 'file', lastModified: Date.now() - 86400000, size: 1200000, parentId: null, url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', isFavorite: true },
    { 
        id: 2, 
        name: 'Getting Started.txt', 
        type: 'file', 
        lastModified: Date.now() - 172800000, 
        size: 1500, 
        parentId: null,
        versions: [
            { timestamp: Date.now() - 172800000, content: '<h1>Welcome to CloudFlow Pro AI!</h1><p>You can edit this document.</p><p>To test the AI feature, right-click on this file and select "Summarize with AI". The Gemini API will generate a summary of this content.</p>' },
            { timestamp: Date.now() - 200000000, content: '<h1>Welcome to CloudFlow Pro!</h1><p>Initial draft.</p>' }
        ]
    },
    { id: 3, name: 'Company Logo.png', type: 'file', lastModified: Date.now() - 259200000, size: 54000, parentId: null, url: 'https://picsum.photos/seed/logo/400/400', tags: ['abstract', 'gradient', 'logo', 'design', 'colorful'] },
    { id: 4, name: 'Project Documents', type: 'folder', lastModified: Date.now(), size: 0, parentId: null, isFavorite: true },
    { 
        id: 5, 
        name: 'Meeting Notes.md', 
        type: 'file', 
        lastModified: Date.now() - 345600000, 
        size: 5200, 
        parentId: 4, 
        versions: [{ timestamp: Date.now() - 345600000, content: '## Meeting Notes\n\n- Discussed Q3 roadmap.\n- Finalized marketing budget.\n- Assigned action items for new feature launch.' }]
    },
    { id: 6, name: 'Archived Projects', type: 'folder', lastModified: Date.now() - 604800000, size: 0, parentId: null },
];

// Icons
export const ICONS: { [key: string]: React.ReactNode } = {
    grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>,
    list: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>,
    folder: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>,
    pdf: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
    image: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>,
    text: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 1h8a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z" clipRule="evenodd" /></svg>,
    file: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>,
    arrowUp: <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>,
    arrowDown: <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>,
    search: <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>,
};
