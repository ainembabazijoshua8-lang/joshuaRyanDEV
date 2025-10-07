export const summarizeContent = async (content: string): Promise<string> => {
    try {
        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data.summary;

    } catch (error) {
        console.error("Error calling local summarization API:", error);
        if (error instanceof Error) {
            // Re-throw the error so it can be caught and handled by the UI component
            throw error;
        }
        throw new Error("An unknown error occurred while contacting the summarization service.");
    }
};
