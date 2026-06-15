import cloudinary from 'cloudinary';

export const upload = async(req: any, res: any) => {
    try {
        const { buffer, public_id } = req.body;
        if(!buffer) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        if(public_id) {
            await cloudinary.v2.uploader.destroy(public_id);
        }
        const cloud = await cloudinary.v2.uploader.upload(buffer, {
            resource_type: 'auto',
            folder: 'resume'
        });
        res.json({
            url: cloud.secure_url,
            public_id: cloud.public_id
        })
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};