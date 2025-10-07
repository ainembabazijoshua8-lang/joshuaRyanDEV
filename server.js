import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// --- Server Setup ---
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("FATAL ERROR: API_KEY is not set in the .env file.");
  process.exit(1); // Exit if no API key
}

const ai = new GoogleGenAI({ apiKey });

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes for development flexibility
app.use(express.json()); // To parse JSON request bodies
app.use(express.static(path.join(__dirname, '/'))); // Serve static files from the project's root directory

// --- API Route for AI Summarization ---
app.post('/api/summarize', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content for summarization is required.' });
  }

  try {
    // Strip HTML tags from the content to send clean text to the model
    const plainTextContent = content.replace(/<[^>]*>?/gm, '');

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Please provide a concise summary of the following document content:\n\n---\n\n${plainTextContent}`,
        config: {
            systemInstruction: "You are an expert summarizer. Provide clear, professional summaries that capture the key points of the document.",
        }
    });

    res.json({ summary: response.text });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate summary from the AI service.' });
  }
});

// --- Catch-all Route for Single Page Application (SPA) ---
// This ensures that any direct navigation to a route is handled by index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`CloudFlow Pro AI server is running!`);
  console.log(`Access the application at http://localhost:${port}`);
});
