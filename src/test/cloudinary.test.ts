// cloudinary.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockConfig = jest.fn<any>();

const mockCloudinary = {
    v2: {
        config: mockConfig,
    },
};

const mockDotenvConfig = jest.fn();

jest.unstable_mockModule('cloudinary', () => ({
    default: mockCloudinary,
}));

jest.unstable_mockModule('dotenv', () => ({
    default: {
        config: mockDotenvConfig,
    },
}));

describe('cloudinary config', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        delete process.env.CLOUDINARY_CLOUD_NAME;
        delete process.env.CLOUDINARY_API_KEY;
        delete process.env.CLOUDINARY_API_SECRET;
    });

    it('should throw error when cloudinary env variables are missing', async () => {
        await expect(
            import('../cloudinary/index.js')
        ).rejects.toThrow(
            'Missing Cloudinary configuration.'
        );
    });

    it('should call dotenv config', async () => {
        process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
        process.env.CLOUDINARY_API_KEY = 'api-key';
        process.env.CLOUDINARY_API_SECRET = 'secret';

        await import('../cloudinary/index.js');

        expect(mockDotenvConfig).toHaveBeenCalled();
    });

    it('should configure cloudinary successfully', async () => {
        process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
        process.env.CLOUDINARY_API_KEY = 'api-key';
        process.env.CLOUDINARY_API_SECRET = 'secret';

        await import('../cloudinary/index.js');

        expect(mockConfig).toHaveBeenCalledWith({
            cloud_name: 'cloud',
            api_key: 'api-key',
            api_secret: 'secret',
        });
    });

    it('should log success message when config exists', async () => {
        process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
        process.env.CLOUDINARY_API_KEY = 'api-key';
        process.env.CLOUDINARY_API_SECRET = 'secret';

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        await import('../cloudinary/index.js');

        expect(consoleSpy).toHaveBeenCalledWith(
            'Cloudinary configuration loaded successfully.'
        );

        consoleSpy.mockRestore();
    });

    it('should export configured cloudinary instance', async () => {
        process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
        process.env.CLOUDINARY_API_KEY = 'api-key';
        process.env.CLOUDINARY_API_SECRET = 'secret';

        const module =
            await import('../cloudinary/index.js');

        expect(module).toBeDefined();
    });
});