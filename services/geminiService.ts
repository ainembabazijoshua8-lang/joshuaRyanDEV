
// services/geminiService.ts
import { FileItem, ChatMessage, AiSearchResult, AiAssistantResponse } from '../types.ts';

const API_BASE_URL = 'http://localhost:3001/api';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }
    return response.json();
}

export const generateTagsForImage = async (base64ImageData: string, mimeType: string): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/generate-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64ImageData, mimeType }),
    });
    const data = await handleResponse<{ tags: string[] }>(response);
    return data.tags;
};

export const chatWithDocument = async (documentContent: string, question: string, history: ChatMessage[]): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/chat-with-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentContent, question, history }),
    });
    const data = await handleResponse<{ answer: string }>(response);
    return data.answer;
};

export const summarizeContent = async (content: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    const data = await handleResponse<{ summary: string }>(response);
    return data.summary;
};

export const performAiSearch = async (files: FileItem[], query: string): Promise<AiSearchResult[]> => {
    const searchableFiles = files
        .filter(f => f.type === 'file' && f.versions && f.versions.length > 0)
        .map(f => ({
            id: f.id,
            name: f.name,
            content: f.versions![0].content,
        }));

    if (searchableFiles.length === 0) return [];

    const response = await fetch(`${API_BASE_URL}/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: searchableFiles, query }),
    });
    const data = await handleResponse<{ results: AiSearchResult[] }>(response);
    return data.results;
};

export const invokeAiAssistant = async (
    prompt: string,
    files: FileItem[],
    selectedIds: Set<number>,
    currentFolderId: number | null
): Promise<AiAssistantResponse> => {
    const response = await fetch(`${API_BASE_URL}/ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, files, selectedIds: Array.from(selectedIds), currentFolderId }),
    });
    return handleResponse<AiAssistantResponse>(response);
};
