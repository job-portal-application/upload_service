import { jest } from '@jest/globals';

export const mockGenerateContent = jest.fn();

export const GoogleGenAI = jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent }
}));
