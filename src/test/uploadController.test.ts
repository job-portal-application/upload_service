// upload.controller.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockUpload = jest.fn<any>();

jest.unstable_mockModule('../../src/services/uploadService.js', () => ({
    upload: mockUpload,
}));

describe('upload controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        mockUpload.mockResolvedValue(undefined);
    });

    it('should call upload service with req and res', async () => {
        const { uploadFile } =
            await import('../../src/controllers/uploadController.js');

        const req = {
            file: {
                originalname: 'resume.pdf',
            },
        };

        const res = {
            json: jest.fn(),
        };

        await uploadFile(req, res);

        expect(mockUpload as any).toHaveBeenCalledWith(
            req,
            res
        );
    });

    it('should await upload service execution', async () => {
        mockUpload.mockResolvedValue('done');

        const { uploadFile } =
            await import('../../src/controllers/uploadController.js');

        await expect(
            uploadFile({}, {})
        ).resolves.toBeUndefined();
    });

    it('should propagate upload service errors', async () => {
        mockUpload.mockRejectedValue(
            new Error('Upload failed')
        );

        const { uploadFile } =
            await import('../../src/controllers/uploadController.js');

        await expect(
            uploadFile({}, {})
        ).rejects.toThrow(
            'Upload failed'
        );
    });

    it('should export uploadFile function', async () => {
        const module =
            await import('../../src/controllers/uploadController.js');

        expect(module.uploadFile).toBeDefined();
    });
});