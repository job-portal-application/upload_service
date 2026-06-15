import * as uploadService from '../services/uploadService.js';

export const uploadFile = async (req: any, res: any) => {
    await uploadService.upload(req, res);
};