import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  file: File,
  folder: string = 'suesy'
): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: no result'));
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
}

export async function uploadMultipleImages(
  files: File[],
  folder: string = 'suesy/products'
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}

export async function deleteImage(url: string): Promise<void> {
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = url.split('/');
    const versionIndex = urlParts.findIndex((part) => part.startsWith('v'));
    
    if (versionIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    const publicIdWithExtension = urlParts.slice(versionIndex + 1).join('/');
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Image deletion error:', error);
    // Don't throw - deletion failures shouldn't break the app
  }
}

export async function deleteMultipleImages(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map((url) => deleteImage(url)));
}

export { cloudinary };