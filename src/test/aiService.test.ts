import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';

const mockGenerateContent = jest.fn<() => Promise<{ text: string | undefined }>>();

jest.unstable_mockModule('@google/genai', () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        models: { generateContent: mockGenerateContent }
    }))
}));

jest.unstable_mockModule('dotenv', () => ({ config: jest.fn(), default: { config: jest.fn() } }));

process.env.GEMINI_API_KEY = 'test-key';

const mockReq = (body: any) => ({ body });
const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('aiService - generate', () => {
    let generate: (req: any, res: any) => Promise<any>;

    beforeAll(async () => {
        const mod = await import('../services/aiService.js');
        generate = mod.generate;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 when skills is missing', async () => {
        const req = mockReq({});
        const res = mockRes();
        await generate(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Skills are required' });
    });

    it('returns parsed JSON on success', async () => {
        const payload = { summary: 'test' };
        mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(payload) });
        const req = mockReq({ skills: 'JavaScript' });
        const res = mockRes();
        await generate(req, res);
        expect(res.json).toHaveBeenCalledWith(payload);
    });

    it('strips markdown fences before parsing', async () => {
        const payload = { summary: 'clean' };
        mockGenerateContent.mockResolvedValueOnce({ text: '````json' + JSON.stringify(payload) + '```' });
        const req = mockReq({ skills: 'Python' });
        const res = mockRes();
        await generate(req, res);
        expect(res.json).toHaveBeenCalledWith(payload);
    });

    it('returns 500 when response.text is empty/undefined', async () => {
        mockGenerateContent.mockResolvedValueOnce({ text: undefined });
        const req = mockReq({ skills: 'Java' });
        const res = mockRes();
        await generate(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to generate response' });
    });

    it('returns 500 when response.text is whitespace only', async () => {
        mockGenerateContent.mockResolvedValueOnce({ text: '   ' });
        const req = mockReq({ skills: 'Go' });
        const res = mockRes();
        await generate(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to generate response' });
    });

    it('returns 500 with rawResponse when JSON.parse fails', async () => {
        const rawText = 'not valid json';
        mockGenerateContent.mockResolvedValueOnce({ text: rawText });
        const req = mockReq({ skills: 'Rust' });
        const res = mockRes();
        await generate(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to parse AI response', rawResponse: rawText });
    });

    it('returns 500 when generateContent throws', async () => {
        mockGenerateContent.mockRejectedValueOnce(new Error('API error'));
        const req = mockReq({ skills: 'TypeScript' });
        const res = mockRes();
        await generate(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'API error' });
    });
});
