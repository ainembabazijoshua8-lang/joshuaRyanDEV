
import React from 'react';
import { ICONS } from '../constants';

interface SidebarProps {
    location: 'browser' | 'trash' | 'favorites' | 'recents';
    setLocation: (location: 'browser' | 'trash' | 'favorites' | 'recents') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ location, setLocation }) => {
    const linkBaseClasses = "flex items-center p-2 rounded-lg font-medium";
    const activeClasses = "bg-primary-light text-primary font-semibold";
    const inactiveClasses = "hover:bg-gray-100 text-text-secondary";

    return (
        <aside className="w-60 bg-white border-r border-border-color p-8 flex-shrink-0 hidden md:flex flex-col">
            <h1 className="text-2xl font-bold text-primary mb-8">CloudFlow Pro AI</h1>
            <nav>
                <ul>
                    <li className="mb-2">
                        <a href="#" onClick={(e) => { e.preventDefault(); setLocation('browser'); }} className={`${linkBaseClasses} ${location === 'browser' ? activeClasses : inactiveClasses}`}>
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                            All Files
                        </a>
                    </li>
                     <li className="mb-2">
                        <a href="#" onClick={(e) => { e.preventDefault(); setLocation('recents'); }} className={`${linkBaseClasses} ${location === 'recents' ? activeClasses : inactiveClasses}`}>
                           {ICONS.recents}
                           Recents
                        </a>
                    </li>
                    <li className="mb-2">
                        <a href="#" onClick={(e) => { e.preventDefault(); setLocation('favorites'); }} className={`${linkBaseClasses} ${location === 'favorites' ? activeClasses : inactiveClasses}`}>
                           <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                           Favorites
                        </a>
                    </li>
                     <li className="mb-2">
                        <a href="#" onClick={(e) => { e.preventDefault(); setLocation('trash'); }} className={`${linkBaseClasses} ${location === 'trash' ? activeClasses : inactiveClasses}`}>
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
