import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined in the environment variables.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// API Endpoints
app.post('/api/summarize', async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Content is required.' });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following content concisely:\n\n---\n${content}\n---`,
        });
        res.json({ summary: response.text });
    } catch (error) {
        console.error('Error in /api/summarize:', error);
        res.status(500).json({ error: 'Failed to generate summary.' });
    }
});

app.post('/api/generate-tags', async (req, res) => {
    try {
        const { base64Image, mimeType } = req.body;
        if (!base64Image || !mimeType) return res.status(400).json({ error: 'Image data and mimeType are required.' });
        
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = { text: 'Generate 5-7 relevant, single-word, lowercase tags for this image. Return as a JSON object like {"tags": ["tag1", "tag2"]}.' };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } } }
            }
        });
        const jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        res.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Error in /api/generate-tags:', error);
        res.status(500).json({ tags: [] });
    }
});

app.post('/api/ai-search', async (req, res) => {
    try {
        const { searchTerm, files } = req.body;
        if (!searchTerm || !files) return res.status(400).json({ error: 'Search term and files are required.' });
        if (files.length === 0) return res.json([]);

        const fileContentForPrompt = files.map(f => `FILE_ID: ${f.id}\nCONTENT:\n${f.content}\n---`).join('\n');
        const prompt = `You are an AI file assistant. Find files relevant to the query. For each match, provide its ID and a short, relevant snippet (max 15 words) from its content. Query: "${searchTerm}"\n\nFile Contents:\n${fileContentForPrompt}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.NUMBER }, snippet: { type: Type.STRING } }, required: ["id", "snippet"] } }
            }
        });
        const jsonString = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        res.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Error in /api/ai-search:', error);
        res.status(500).json({ error: 'AI search failed.' });
    }
});

app.post('/api/chat-with-document', async (req, res) => {
    try {
        const { documentContent, question, chatHistory } = req.body;
        if (!documentContent || !question) return res.status(400).json({ error: 'Document content and question are required.' });

        const history = (chatHistory || []).map((m: { role: string, content: string}) => `${m.role}: ${m.content}`).join('\n');
        const prompt = `You are a helpful AI assistant. Answer the question based ONLY on the provided document content. Do not use external knowledge. If the answer isn't in the document, say so. Use the chat history for context. \n\nDOCUMENT:\n---\n${documentContent}\n---\n\nCHAT HISTORY:\n${history}\n\nQUESTION: ${question}`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.json({ answer: response.text });
    } catch (error) {
        console.error('Error in /api/chat-with-document:', error);
        res.status(500).json({ error: 'Failed to get answer from AI.' });
    }
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
