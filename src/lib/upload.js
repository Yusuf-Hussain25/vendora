// Image uploads for product photos and store logos.
// NEXT_PUBLIC_UPLOAD_PROVIDER = "cloudinary" (browser upload with an unsigned preset) | "url" (paste a link)

const provider = process.env.NEXT_PUBLIC_UPLOAD_PROVIDER || "url";
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const uploadsEnabled = provider === "cloudinary" && Boolean(cloudName && preset);

export async function uploadImage(file, folder = "vendora") {
  if (!uploadsEnabled) throw new Error("Image uploads aren't configured. Paste an image URL instead.");
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be 8 MB or smaller.");

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", preset);
  body.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Upload failed. Please try again.");
  return data.secure_url;
}

export const isImageUrl = (value) => /^https:\/\/\S+$/i.test(value.trim());
