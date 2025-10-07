import { AiSearchResult, ChatMessage } from "../types";

const API_BASE_URL = '/api'; // Use relative path for proxying

/**
 * Summarizes the given content by calling the backend API.
 */
export const summarizeContent = async (content: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok.');
        }
        const data = await response.json();
        return data.summary;
    } catch (error) {
        console.error("Error summarizing content:", error);
        throw new Error("Failed to generate summary. Please check the API server and try again.");
    }
};

/**
 * Generates descriptive tags for an image by calling the backend API.
 */
export const generateTagsForImage = async (base64Image: string, mimeType: string): Promise<string[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image, mimeType }),
        });
        if (!response.ok) return []; // Graceful failure
        const data = await response.json();
        return data.tags || [];
    } catch (error) {
        console.error("Error generating image tags:", error);
        return [];
    }
};

/**
 * Performs a semantic search over file contents by calling the backend API.
 */
export const performAiSearch = async (
    searchTerm: string,
    files: { id: number; content: string }[]
): Promise<AiSearchResult[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ searchTerm, files }),
        });
        if (!response.ok) {
             const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok.');
        }
        const results = await response.json();
        if (Array.isArray(results)) {
            // Ensure ids are numbers, as model might return strings
            return results.map(r => ({ ...r, id: Number(r.id) })).filter(r => r.id && r.snippet);
        }
        return [];
    } catch (error) {
        console.error("Error performing AI search:", error);
        throw new Error("AI search failed. Please try again later.");
    }
};

/**
 * Sends a question about a document to the backend API for an AI-powered answer.
 */
export const chatWithDocument = async (
    documentContent: string,
    question: string,
    chatHistory: ChatMessage[]
): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat-with-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentContent, question, chatHistory }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok.');
        }
        const data = await response.json();
        return data.answer;
    } catch (error) {
        console.error("Error chatting with document:", error);
        throw new Error("Failed to get a response from the AI. Please try again.");
    }
};
