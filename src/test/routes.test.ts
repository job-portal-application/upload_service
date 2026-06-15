// upload.routes.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockPost = jest.fn<any>();

const mockRouter = {
    post: mockPost,
};

const mockExpress = {
    Router: jest.fn(() => mockRouter),
};

const mockUploadFile = jest.fn<any>();

jest.unstable_mockModule('express', () => ({
    default: mockExpress,
}));

jest.unstable_mockModule('../../src/controllers/uploadController.js', () => ({
    uploadFile: mockUploadFile,
}));

describe('upload routes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should create express router', async () => {
        await import('../routes/routes.js');

        expect(mockExpress.Router).toHaveBeenCalled();
    });

    it('should register /upload route', async () => {
        await import('../routes/routes.js');

        expect(mockPost as any).toHaveBeenCalledWith(
            '/upload',
            mockUploadFile
        );
    });

    it('should export router instance', async () => {
        const module =
            await import('../routes/routes.js');

        expect(module.default).toBe(mockRouter);
    });

    it('should call router.post exactly once', async () => {
        await import('../routes/routes.js');

        expect(mockPost as any).toHaveBeenCalledTimes(1);
    });
});