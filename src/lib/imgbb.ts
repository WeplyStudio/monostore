/**
 * Service to handle image uploads to ImgBB.
 */
export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = '1fa90970c71549cdd68ce59dcf6f3a12';
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
