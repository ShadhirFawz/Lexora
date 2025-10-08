const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToCloudinary = async (file: File, folder: string = 'courses'): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET!);
    formData.append('folder', folder);
    formData.append('cloud_name', CLOUD_NAME!);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        url: data.secure_url,
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: 'Upload failed. Please try again.',
    };
  }
};

export const uploadResourceToCloudinary = async (file: File, folder: string = 'resources'): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET!);
    formData.append('folder', folder);
    formData.append('cloud_name', CLOUD_NAME!);
    
    // For resources, we might want to keep the original format
    formData.append('resource_type', 'raw');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        url: data.secure_url,
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('Cloudinary resource upload error:', error);
    return {
      success: false,
      error: 'Upload failed. Please try again.',
    };
  }
};