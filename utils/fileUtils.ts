import { FileItem, FileVersion } from '../types.ts';
import { generateTagsForImage } from '../services/geminiService.ts';
import { EDITABLE_EXTENSIONS, PREVIEWABLE_EXTENSIONS } from '../constants.tsx';

export const generateUniqueId = (): number => {
    // Combine timestamp with a random number to ensure a high degree of uniqueness
    // in client-side generation without needing to check existing IDs.
    return Math.floor(Math.random() * 1000000) + Date.now();
};

export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const isImage = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return !!extension && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension);
};

export const isEditable = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return !!extension && EDITABLE_EXTENSIONS.includes(extension);
};

export const isPreviewable = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return !!extension && PREVIEWABLE_EXTENSIONS.includes(extension);
};

const readFileAs = (file: File, format: 'dataURL' | 'text', signal: AbortSignal): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            return reject(new DOMException('Aborted', 'AbortError'));
        }
        const reader = new FileReader();
        
        const abortHandler = () => {
            reader.abort();
            reject(new DOMException('Aborted', 'AbortError'));
        };

        signal.addEventListener('abort', abortHandler, { once: true });

        reader.onload = () => {
            signal.removeEventListener('abort', abortHandler);
            resolve(reader.result as string)
        };
        reader.onerror = () => {
             signal.removeEventListener('abort', abortHandler);
             reject(reader.error)
        };

        if (format === 'dataURL') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
};

const simulateProgress = (duration: number, onProgress: (p: number) => void, signal: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
        let progress = 0;
        const steps = 10;
        const stepDuration = duration / steps;

        const interval = setInterval(() => {
            if (signal.aborted) {
                clearInterval(interval);
                return reject(new DOMException('Aborted', 'AbortError'));
            }
            progress += 100 / steps;
            onProgress(Math.min(progress, 90)); // Cap at 90 to leave room for final processing
            if (progress >= 100) {
                clearInterval(interval);
                resolve();
            }
        }, stepDuration);
    });
};

export const processSingleFileForUpload = async (
    file: File, 
    parentId: number | null, 
    onProgress: (progress: number) => void, 
    signal: AbortSignal
): Promise<FileItem> => {
    
    // Simulate reading/processing progress
    const simulatedDuration = Math.max(500, file.size / 50000); // at least 0.5s, scales with size
    
    await simulateProgress(simulatedDuration, onProgress, signal);

    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const newFile: Partial<FileItem> = {
        id: generateUniqueId(),
        name: file.name,
        type: 'file',
        lastModified: file.lastModified,
        size: file.size,
        parentId,
    };

    if (isImage(file.name)) {
        const base64 = await readFileAs(file, 'dataURL', signal);
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        newFile.url = base64;
        
        onProgress(95); // Progress before API call
        
        try {
            // No need to check signal here as tag generation is a nice-to-have, not critical
            const tags = await generateTagsForImage(base64.split(',')[1], file.type);
            newFile.tags = tags;
        } catch (e) {
            console.error("Tag generation failed for", file.name, e);
        }

    } else if (isEditable(file.name)) {
        const content = await readFileAs(file, 'text', signal);
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        newFile.versions = [{ timestamp: Date.now(), content }];
    } else if (isPreviewable(file.name)) {
        const blob = new Blob([file], { type: file.type });
        newFile.url = URL.createObjectURL(blob);
    }
    
    onProgress(100);
    return newFile as FileItem;
};


export const findRestorationParent = (file: FileItem, allFiles: FileItem[]): number | null => {
    if (file.parentId === null) return null; // Already at root
    const parentExists = allFiles.some(f => f.id === file.parentId && !f.trashedOn);
    return parentExists ? file.parentId : null;
};

export const downloadFile = (file: FileItem) => {
    if (!file || file.type === 'folder') return;
    const a = document.createElement('a');
    let url: string | undefined = file.url;

    if (!url && file.versions && file.versions.length > 0) {
        // Create a blob for text-based content
        const blob = new Blob([file.versions[0].content], { type: 'text/plain' });
        url = URL.createObjectURL(blob);
        a.href = url;
    } else if (url) {
        a.href = url;
    } else {
        console.error("No downloadable content for file:", file.name);
        return; // No URL and no content to create a blob from
    }
    
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Revoke blob URL after download
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};

export const duplicateFiles = (
    fileIds: Set<number>,
    allFiles: FileItem[],
    targetParentId: number | null
): FileItem[] => {
    const newFiles: FileItem[] = [];
    const idMap = new Map<number, number>();

    const filesToCopy = allFiles.filter(f => fileIds.has(f.id));

    // Helper to find a unique name in the target folder, considering existing files
    // and other files being copied in the same batch.
    const findAvailableName = (name: string, parentId: number | null, existingFiles: FileItem[], newClonedFiles: FileItem[]): string => {
        const siblings = existingFiles.filter(file => file.parentId === parentId);
        const newSiblings = newClonedFiles.filter(file => file.parentId === parentId);
        
        let finalName = name;
        let counter = 1;
        
        const nameExists = (n: string) => 
            siblings.some(s => s.name.toLowerCase() === n.toLowerCase()) ||
            newSiblings.some(s => s.name.toLowerCase() === n.toLowerCase());

        if (nameExists(finalName)) {
            const extensionIndex = name.lastIndexOf('.');
            const baseName = extensionIndex > -1 ? name.substring(0, extensionIndex) : name;
            const extension = extensionIndex > -1 ? name.substring(extensionIndex) : '';
            
            do {
                finalName = `${baseName} (${counter})${extension}`;
                counter++;
            } while (nameExists(finalName));
        }
        
        return finalName;
    };

    // First pass: create new top-level items and map old IDs to new IDs
    for (const file of filesToCopy) {
        const newId = generateUniqueId();
        idMap.set(file.id, newId);

        // If pasting in the same folder, add a "Copy" suffix. Otherwise, use the original name.
        const initialName = file.parentId === targetParentId ? `Copy of ${file.name}` : file.name;
        const uniqueName = findAvailableName(initialName, targetParentId, allFiles, newFiles);

        newFiles.push({
            ...file,
            id: newId,
            parentId: targetParentId,
            name: uniqueName,
            lastModified: Date.now(),
        });
    }

    // Recursively find and copy children
    const copyChildren = (oldParentId: number, newParentId: number) => {
        const children = allFiles.filter(f => f.parentId === oldParentId);
        for (const child of children) {
            const newChildId = generateUniqueId();
            idMap.set(child.id, newChildId);
            const newChild: FileItem = {
                ...child,
                id: newChildId,
                parentId: newParentId,
            };
            newFiles.push(newChild);

            if (child.type === 'folder') {
                copyChildren(child.id, newChildId);
            }
        }
    };
    
    for (const file of filesToCopy) {
        if (file.type === 'folder') {
            copyChildren(file.id, idMap.get(file.id)!);
        }
    }

    return newFiles;
};

export const isDroppingInChild = (draggedIds: Set<number>, targetFolderId: number | null, allFiles: FileItem[]): boolean => {
    if (targetFolderId === null) return false;
    if (draggedIds.has(targetFolderId)) return true;

    let currentId = targetFolderId;
    while (currentId !== null) {
        const parent = allFiles.find(f => f.id === currentId);
        if (!parent || parent.parentId === null) {
            return false;
        }
        if (draggedIds.has(parent.parentId)) {
            return true;
        }
        currentId = parent.parentId;
    }
    return false;
};