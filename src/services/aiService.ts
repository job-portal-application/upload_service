import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    throw new Error('Missing GEMINI_API_KEY');
}
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

export const generate = async(req: any, res: any) => {
    try {
        const { skills } = req.body;
        if(!skills) {
            return res.status(400).json({ message: 'Skills are required' });
        }
        const prompt = `
Based on the following skills: ${skills}.
Please act as a career advisor and generate a career path suggestion.
Your entire response must be in a valid JSON format. Do not include any text or markdown
formatting outside of the JSON structure.
The JSON object should have the following structure:
{
"summary": "A brief, encouraging summary of the user's skill set and their general job
title.",
"jobOptions": [
{
"title": "The name of the job role.",
"responsibilities": "A description of what the user would do in this role.",
"why": "An explanation of why this role is a good fit for their skills."
}
],
"skillsToLearn": [
{
"category": "A general category for skill improvement (e.g., 'Deepen Your Existing Stack
Mastery', 'DevOps & Cloud').",
"skills": [
{
"title": "The name of the skill to learn.",
"why": "Why learning this skill is important.",
"how": "Specific examples of how to learn or apply this skill."
}
]
}
],
"learningApproach": {
"title": "How to Approach Learning",
"points": ["A bullet point list of actionable advice for learning."]
}
}
`;
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        let jsonResponse;
        try {
            const rawText = response.text?.replace(/````json/g, '').replace(/```/g, '').trim();
            if (!rawText) {
                return res.status(500).json({ message: 'Failed to generate response' });
            }
            jsonResponse = JSON.parse(rawText);
            res.json(jsonResponse);
        } catch (error: any) {
            return res.status(500).json({ message: 'Failed to parse AI response', rawResponse: response.text });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}