export const uploadToCloudinary = async (file: File, type: 'image' | 'resource' = 'image'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Use your backend endpoint for Cloudinary upload
  const endpoint = type === 'image' ? '/upload/course-image' : '/upload/chapter-image';
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.image_url || data.resource_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};