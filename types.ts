
export interface FileItem {
    id: number;
    name: string;
    type: 'file' | 'folder';
    lastModified: number;
    size: number;
    url?: string;
    content?: string;
}

export type ViewMode = 'grid' | 'list';

export type ModalType = 'upload' | 'new-folder' | 'confirm-delete' | 'view' | 'details' | 'summarize';

export type ModalState = 
    | { type: null }
    | { type: 'upload' }
    | { type: 'new-folder' }
    | { type: 'confirm-delete', count: number }
    | { type: 'view', file: FileItem }
    | { type: 'details', file: FileItem }
    | { type: 'summarize', file: FileItem };

export interface ContextMenuState {
    x: number;
    y: number;
    file: FileItem;
}

export type SortableField = 'name' | 'lastModified' | 'size';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    key: SortableField;
    direction: SortDirection;
}
