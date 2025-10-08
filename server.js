// server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Endpoint to generate tags for an image
app.post('/api/generate-tags', async (req, res) => {
    const { image, mimeType } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: image, mimeType } },
                    { text: "Analyze this image and generate 3-5 relevant, single-keyword tags. Return as a JSON object: {\"tags\": [\"tag1\", \"tag2\"]}" }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } },
                    required: ['tags']
                }
            }
        });
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error('Error in /api/generate-tags:', error);
        res.status(500).json({ error: 'Failed to generate tags' });
    }
});

// Endpoint for document chat
app.post('/api/chat-with-document', async (req, res) => {
    const { documentContent, question, history } = req.body;
    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are an AI assistant. The user has provided a document and will ask questions. Answer based *only* on the document's content. Document:\n\n---\n\n${documentContent}\n\n---`,
            },
            history: history.map((m: any) => ({ role: m.role, parts: [{ text: m.content }] })),
        });
        const response = await chat.sendMessage({ message: question });
        res.json({ answer: response.text });
    } catch (error) {
        console.error('Error in /api/chat-with-document:', error);
        res.status(500).json({ error: 'Failed to get chat response' });
    }
});

// Endpoint for summarization
app.post('/api/summarize', async (req, res) => {
    const { content } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please provide a concise summary of the following document:\n\n${content}`,
        });
        res.json({ summary: response.text });
    } catch (error) {
        console.error('Error in /api/summarize:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

// Endpoint for AI content search
app.post('/api/ai-search', async (req, res) => {
    const { files, query } = req.body;
    try {
        const prompt = `
            User query: "${query}"
            Documents:
            ${files.map((f: any) => `ID: ${f.id}, Name: "${f.name}", Content: "${f.content.substring(0, 2000).replace(/"/g, "'")}"`).join('\n\n')}
            
            Analyze the documents and query. Return a JSON object with a key "results" which is an array of objects. Each object should have an "id" (the document ID) and a "snippet" (a short, relevant quote from the content explaining why it matches).
            Example: {"results": [{"id": 123, "snippet": "...relevant text..."}]}
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        results: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.NUMBER },
                                    snippet: { type: Type.STRING }
                                },
                                required: ['id', 'snippet']
                            }
                        }
                    },
                    required: ['results']
                }
            }
        });
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error('Error in /api/ai-search:', error);
        res.status(500).json({ error: 'Failed to perform AI search' });
    }
});

// Endpoint for the AI Assistant
app.post('/api/ai-assistant', async (req, res) => {
    const { prompt, files, selectedIds, currentFolderId } = req.body;
    try {
        const systemInstruction = `
        You are an AI assistant for a file management application. Your goal is to convert user's natural language prompts into a sequence of executable actions.
        You must respond with a JSON object containing two keys: "explanation" (a user-friendly string explaining what you're about to do) and "actions" (an array of action objects).

        Available Actions:
        1. selectFiles: Selects files by name.
           - { "action": "selectFiles", "fileNames": ["name1.txt", "image.png"] }
        2. createFolder: Creates a new folder in the current directory.
           - { "action": "createFolder", "folderName": "New Documents" }
        3. renameFile: Renames a file. oldName must be exact.
           - { "action": "renameFile", "oldName": "report-v1.txt", "newName": "report-v2.txt" }
        4. moveFiles: Moves specified files to a destination folder.
           - { "action": "moveFiles", "fileNames": ["file1.txt"], "destinationFolderName": "Archive" }
        5. deleteFiles: Moves specified files to the trash.
           - { "action": "deleteFiles", "fileNames": ["temp.txt"] }

        Context:
        - The current folder ID is: ${currentFolderId === null ? 'root' : currentFolderId}.
        - The currently selected file IDs are: [${[...selectedIds].join(', ')}].
        - List of all files:
          ${files.map((f: any) => `- ID: ${f.id}, Name: "${f.name}", Type: ${f.type}, ParentID: ${f.parentId}`).join('\n')}

        User Prompt: "${prompt}"

        Based on the user's prompt and the provided context, generate the JSON response. Be smart and chain actions together. For example, to move files, you might need to create the destination folder first if it doesn't exist.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemInstruction,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: { type: Type.STRING },
                        actions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    action: { type: Type.STRING },
                                    fileNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    folderName: { type: Type.STRING },
                                    oldName: { type: Type.STRING },
                                    newName: { type: Type.STRING },
                                    destinationFolderName: { type: Type.STRING }
                                },
                                required: ['action']
                            }
                        }
                    },
                    required: ['explanation', 'actions']
                }
            }
        });

        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error('Error in /api/ai-assistant:', error);
        res.status(500).json({ error: 'Failed to process assistant command.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
