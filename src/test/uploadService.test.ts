import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockedUpload = jest.fn();

jest.unstable_mockModule('cloudinary', () => ({
    default: {
        v2: {
            uploader: {
                upload: mockedUpload,
                destroy: jest.fn(),
            },
        },
    },
}));

const { upload } = await import(
    '../services/uploadService.js'
);

describe('upload service', () => {
    let req: any;
    let res: any;
    beforeEach(() => {
        req = {
            body: {
                buffer: 'sample-buffer',
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        mockedUpload.mockReset();
    });

    // should upload file successfully
    test('should upload file successfully', async () => {
        (mockedUpload as any).mockResolvedValue({
            secure_url: 'https://cloudinary.com/test.pdf',
            public_id: 'resume123',
        });
        await upload(req, res);
        expect(mockedUpload).toHaveBeenCalledWith(
            'sample-buffer',
            {
                resource_type: 'raw',
                folder: 'resumes',
            }
        );
        expect(res.json).toHaveBeenCalledWith({
            url: 'https://cloudinary.com/test.pdf',
            public_id: 'resume123',
        });
    });

    // should return 400 if buffer missing
    test('should return 400 if buffer missing', async () => {
        req.body.buffer = null;
        await upload(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'No file uploaded',
        });
    });

    // should return 500 if upload fails
    test('should return 500 if cloudinary upload fails', async () => {
        (mockedUpload as any).mockRejectedValue(
            new Error('Cloudinary error')
        );
        await upload(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Cloudinary error',
        });
    });
});