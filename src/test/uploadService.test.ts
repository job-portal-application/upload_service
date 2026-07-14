import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockedDestroy = jest.fn();
const mockedUpload = jest.fn();

jest.unstable_mockModule('cloudinary', () => ({
    default: {
        v2: {
            uploader: {
                upload: mockedUpload,
                destroy: mockedDestroy,
            },
        },
    },
}));

const { upload } = await import('../services/uploadService.js');

describe('upload service', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        req = { body: { buffer: 'sample-buffer' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockedUpload.mockReset();
        mockedDestroy.mockReset();
    });

    test('should upload file successfully without public_id', async () => {
        (mockedUpload as any).mockResolvedValue({
            secure_url: 'https://cloudinary.com/test.pdf',
            public_id: 'resume123',
        });
        await upload(req, res);
        expect(mockedDestroy).not.toHaveBeenCalled();
        expect(mockedUpload).toHaveBeenCalledWith('sample-buffer', {
            resource_type: 'auto',
            folder: 'resume',
        });
        expect(res.json).toHaveBeenCalledWith({
            url: 'https://cloudinary.com/test.pdf',
            public_id: 'resume123',
        });
    });

    test('should destroy old file and upload when public_id is provided', async () => {
        req.body.public_id = 'old-id';
        (mockedUpload as any).mockResolvedValue({
            secure_url: 'https://cloudinary.com/new.pdf',
            public_id: 'new-id',
        });
        (mockedDestroy as any).mockResolvedValue({});
        await upload(req, res);
        expect(mockedDestroy).toHaveBeenCalledWith('old-id');
        expect(res.json).toHaveBeenCalledWith({
            url: 'https://cloudinary.com/new.pdf',
            public_id: 'new-id',
        });
    });

    test('should return 400 if buffer is missing', async () => {
        req.body.buffer = null;
        await upload(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'No file uploaded' });
    });

    test('should return 500 if cloudinary upload throws', async () => {
        (mockedUpload as any).mockRejectedValue(new Error('Cloudinary error'));
        await upload(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Cloudinary error' });
    });
});
