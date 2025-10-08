// types.ts

export type ViewMode = 'grid' | 'list';
export type SortDirection = 'asc' | 'desc';
export type SortableField = 'name' | 'size' | 'lastModified' | 'lastOpened' | 'trashedOn';
export type Location = 'browser' | 'trash' | 'favorites' | 'recents';
export type ContextAction = 'rename' | 'cut' | 'copy' | 'paste' | 'delete' | 'restore' | 'favorite' | 'details' | 'summary' | 'download' | 'preview' | 'emptyTrash' | 'openInNewTab';

export interface SortConfig {
    key: SortableField;
    direction: SortDirection;
}

export interface FileVersion {
    timestamp: number;
    content: string;
}

export interface FileItem {
    id: number;
    name: string;
    type: 'file' | 'folder';
    lastModified: number;
    size: number;
    parentId: number | null;
    url?: string;
    tags?: string[];
    versions?: FileVersion[];
    isFavorite?: boolean;
    trashedOn?: number;
    lastOpened?: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface ClipboardState {
    action: 'copy' | 'cut';
    fileIds: Set<number>;
}

export type AiAction =
  | { action: 'selectFiles'; fileNames: string[] }
  | { action: 'createFolder'; folderName: string }
  | { action: 'renameFile'; oldName: string; newName: string }
  | { action: 'moveFiles'; fileNames: string[]; destinationFolderName: string }
  | { action: 'deleteFiles'; fileNames: string[] };

export interface AiAssistantResponse {
  explanation: string;
  actions: AiAction[];
}

export interface AiSearchResult {
    id: number;
    snippet: string;
}

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'cancelled' | 'error';

export interface UploadItem {
  id: string; // unique id for this upload instance
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
  controller: AbortController;
}


export type ModalState =
    | { type: 'upload', currentFolderId: number | null }
    | { type: 'newFolder', currentFolderId: number | null, initialName?: string }
    | { type: 'confirmAction'; title: string; message: string; confirmText: string; confirmClass?: string; onConfirm: () => void; showCancelButton?: boolean; }
    | { type: 'editor'; file: FileItem }
    | { type: 'details'; files: FileItem[] }
    | { type: 'summary'; file: FileItem }
    | { type: 'assistant' }
    | null;