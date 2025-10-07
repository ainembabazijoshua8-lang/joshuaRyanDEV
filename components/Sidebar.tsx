
import React from 'react';

const Sidebar: React.FC = () => {
    return (
        <aside className="w-60 bg-white border-r border-border-color p-8 flex-shrink-0 hidden md:flex flex-col">
            <h1 className="text-2xl font-bold text-primary mb-8">CloudFlow Pro AI</h1>
            <nav>
                <ul>
                    <li className="mb-2">
                        <a href="#" className="flex items-center p-2 rounded-lg bg-primary-light text-primary font-semibold">
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                            All Files
                        </a>
                    </li>
                    <li className="mb-2">
                        <a href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-text-secondary font-medium">
                           <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                           Recents
                        </a>
                    </li>
                    <li className="mb-2">
                        <a href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-text-secondary font-medium">
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            Trash
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
