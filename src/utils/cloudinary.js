// src/utils/cloudinary.js

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

/* Our memory type, decided from the file itself (Cloudinary reports PDFs as "image") */
export const getMediaType = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
};

const FOLDERS = {
  image: "ourspace_images",
  video: "ourspace_videos",
  document: "ourspace_documents",
  audio: "ourspace_audio",
};

/* ---------- SINGLE UPLOAD FOR EVERY FILE TYPE ---------- */
export const uploadMedia = async (file) => {
  const type = getMediaType(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", FOLDERS[type]);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Upload failed");
  }

  return { url: data.secure_url, type, fileName: file.name };
};
