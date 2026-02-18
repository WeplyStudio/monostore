
/**
 * Service to handle image uploads to ImgBB.
 */
export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = 'YOUR_IMGBB_API_KEY'; // User should replace this with their actual key
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return result.data.url;
    } else {
      throw new Error(result.error?.message || 'Failed to upload to ImgBB');
    }
  } catch (error) {
    console.error('ImgBB Upload Error:', error);
    throw error;
  }
}
