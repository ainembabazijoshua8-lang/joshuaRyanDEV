
export type ViewMode = 'grid' | 'list';
export type SearchMode = 'filename' | 'content';

export interface FileItem {
    id: number;
    name: string;
    type: 'file' | 'folder';
    lastModified: number;
    lastOpened?: number; // Added for Recents feature
    size: number;
    parentId: number | null;
    isFavorite?: boolean;
    isTrashed?: boolean;
    trashedOn?: number;
    // For files
    url?: string;
    versions?: { timestamp: number; content: string }[];
    tags?: string[];
}

export type SortableField = 'name' | 'lastModified' | 'size';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    key: SortableField;
    direction: SortDirection;
}

export type ModalState =
    | { type: null }
    | { type: 'upload', currentFolderId: number | null }
    | { type: 'new-folder', currentFolderId: number | null }
    | { type: 'confirm-delete', count: number, isPermanent: boolean, onConfirm: () => void, isEmptyingAll?: boolean }
    | { type: 'view', file: FileItem }
    | { type: 'details', files: FileItem[] }
    | { type: 'summarize', file: FileItem };

export interface ContextMenuState {
    x: number;
    y: number;
    file: FileItem | null; // Can be null for clicking on canvas
}

export interface AiSearchResult {
    id: number;
    snippet: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface ClipboardState {
    action: 'copy' | 'cut';
    fileIds: Set<number>;
}

export type ContextAction = 'open' | 'preview' | 'summarize' | 'details' | 'rename' | 'favorite' | 'trash' | 'restore' | 'delete' | 'copy' | 'cut' | 'paste';
