import { FileItem } from './types.ts';

export const initialFiles: FileItem[] = [
    { id: 1, name: 'Documents', type: 'folder', lastModified: Date.now(), size: 0, parentId: null, isFavorite: true },
    { id: 2, name: 'Photos', type: 'folder', lastModified: Date.now(), size: 0, parentId: null },
    { id: 3, name: 'Music', type: 'folder', lastModified: Date.now(), size: 0, parentId: null },
    { id: 4, name: 'Archive', type: 'folder', lastModified: Date.now(), size: 0, parentId: 1 },
    { id: 5, name: 'Report-2024-Q1.txt', type: 'file', lastModified: Date.now() - 2000000, lastOpened: Date.now() - 1000000, size: 1024, parentId: 1, versions: [{ timestamp: Date.now(), content: 'This is the first quarterly report for 2024.' }], isFavorite: true },
    { id: 6, name: 'Project-Alpha-Proposal.txt', type: 'file', lastModified: Date.now() - 5000000, size: 2048, parentId: 1, versions: [{ timestamp: Date.now(), content: 'Proposal document for Project Alpha.' }] },
    { id: 7, name: 'beach-sunset.jpg', type: 'file', lastModified: Date.now() - 8000000, size: 512000, parentId: 2, url: 'https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=2070&auto=format&fit=crop' },
    { id: 8, name: 'mountain-hike.png', type: 'file', lastModified: Date.now() - 9000000, size: 812000, parentId: 2, url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop' },
    { id: 9, name: 'lofi-beats.mp3', type: 'file', lastModified: Date.now() - 3000000, size: 4096000, parentId: 3 },
    { id: 10, name: 'README.md', type: 'file', lastModified: Date.now() - 10000000, size: 512, parentId: null, versions: [{ timestamp: Date.now(), content: '# Welcome to CloudFlow Pro AI!' }] },
];
