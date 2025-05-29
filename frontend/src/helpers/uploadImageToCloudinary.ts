export async function uploadImageToCloudinary(file: File | string, uploadPreset: string, cloudName: string): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();

  if (typeof file === "string") {
    formData.append("file", file);
  } else {
    formData.append("file", file);
  }
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error("No se pudo subir la imagen");
  return data.secure_url;
}