
import { FileItem } from '../types';
import { generateTagsForImage } from '../services/geminiService';

export const getFileExtension = (filename: string): string => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
};

export const isImage = (filename: string): boolean => {
    const ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
};

export const isPdf = (filename: string): boolean => {
    return getFileExtension(filename) === 'pdf';
};

export const isEditable = (filename:string): boolean => {
    const ext = getFileExtension(filename);
    return ['txt', 'md', 'json', 'html', 'css', 'js', 'ts'].includes(ext);
};

let lastId = Date.now();
export const generateUniqueId = (): number => {
    return ++lastId;
};

export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const processFilesForUpload = async (fileList: FileList, parentId: number | null): Promise<FileItem[]> => {
    const fileArray = Array.from(fileList);
    
    const newFilePromises = fileArray.map(file => new Promise<FileItem>(resolve => {
        const reader = new FileReader();
        const commonProps = {
            id: generateUniqueId(),
            name: file.name,
            type: 'file' as 'file',
            lastModified: file.lastModified,
            size: file.size,
            parentId: parentId,
        };

        if (isImage(file.name)) {
             reader.onload = async () => {
                const dataUrl = reader.result as string;
                const imageBytes = dataUrl.split(',')[1];
                const tags = await generateTagsForImage(imageBytes, file.type);
                resolve({ ...commonProps, url: dataUrl, tags });
            };
            reader.readAsDataURL(file);
        } else if (isPdf(file.name)) {
            reader.onload = () => resolve({ ...commonProps, url: reader.result as string });
            reader.readAsDataURL(file);
        } else if (isEditable(file.name)) {
            reader.onload = () => {
                const content = reader.result as string;
                resolve({ ...commonProps, versions: [{ timestamp: Date.now(), content }] });
            };
            reader.readAsText(file);
        } else {
            resolve(commonProps);
        }
    }));

    return Promise.all(newFilePromises);
};

/**
 * Checks if a dragged item (or one of the dragged items) is a parent
 * of the target folder, preventing dropping a folder into its own child.
 */
export const isDroppingInChild = (draggedIds: Set<number>, targetFolderId: number, allFiles: FileItem[]): boolean => {
    const draggedFolders = new Set(Array.from(draggedIds).filter(id => allFiles.find(f => f.id === id)?.type === 'folder'));
    if (draggedFolders.size === 0) return false; // Not dragging a folder, so it's safe

    let currentParentId: number | null = targetFolderId;
    while (currentParentId !== null) {
        if (draggedFolders.has(currentParentId)) {
            return true; // Found a dragged folder in the target's ancestry
        }
        const currentParent = allFiles.find(f => f.id === currentParentId);
        currentParentId = currentParent ? currentParent.parentId : null;
    }

    return false;
};

/**
 * Determines the correct parent folder for a file being restored from the trash.
 * If the original parent exists and is not trashed, it's used. Otherwise, it defaults to the root.
 */
export const findRestorationParent = (fileToRestore: FileItem, allFiles: FileItem[]): number | null => {
    if (fileToRestore.parentId === null) {
        return null; // Already at root
    }
    const parent = allFiles.find(f => f.id === fileToRestore.parentId);
    
    // If parent doesn't exist or is also trashed, restore to root.
    if (!parent || parent.isTrashed) {
        return null;
    }
    
    return fileToRestore.parentId;
};

/**
 * Recursively duplicates files and folders for the copy-paste feature.
 */
export const duplicateFiles = (
    idsToCopy: Set<number>,
    allFiles: FileItem[],
    targetParentId: number | null
): FileItem[] => {
    const newFiles: FileItem[] = [];
    const idMap = new Map<number, number>(); // Maps old ID to new ID

    const itemsToCopy = allFiles.filter(f => idsToCopy.has(f.id));

    // First pass: create all new items and map old IDs to new IDs
    itemsToCopy.forEach(item => {
        const newId = generateUniqueId();
        idMap.set(item.id, newId);
        newFiles.push({
            ...item,
            id: newId,
            parentId: targetParentId,
            lastModified: Date.now(),
        });
    });

    // Second pass: recursively copy children for any copied folders
    const deepCopyChildren = (oldParentId: number, newParentId: number) => {
        const children = allFiles.filter(f => f.parentId === oldParentId);
        for (const child of children) {
            const newChildId = generateUniqueId();
            idMap.set(child.id, newChildId);
            const newChild: FileItem = {
                ...child,
                id: newChildId,
                parentId: newParentId,
                lastModified: Date.now(),
            };
            newFiles.push(newChild);
            if (newChild.type === 'folder') {
                deepCopyChildren(child.id, newChild.id);
            }
        }
    };

    newFiles.forEach(newItem => {
        if (newItem.type === 'folder') {
            const originalId = Array.from(idMap.entries()).find(([, newId]) => newId === newItem.id)?.[0];
            if (originalId) {
                deepCopyChildren(originalId, newItem.id);
            }
        }
    });

    return newFiles;
};
