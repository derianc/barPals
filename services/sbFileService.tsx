import { supabase } from "@/supabase";
import * as FileSystem from "expo-file-system";

export async function uploadReceipt(localUri: string, bucket: string, folderPath?: string): Promise<string> {
  console.log("📷 Uploading receipt:", localUri);

  // 1. Read file as base64
  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    console.error("❌ Failed to read local file:", err);
    throw new Error("Could not read file from local URI.");
  }

  // 2. Build blob from base64
  const extension = localUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const mimeType = extension === "jpg" || extension === "jpeg" ? "image/jpeg"
    : extension === "png" ? "image/png"
    : extension === "pdf" ? "application/pdf"
    : "application/octet-stream";

  const blob = base64ToBlob(base64, mimeType);

  // 3. Filename and path
  const filename = `${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`;
  const pathInBucket = folderPath ? `${folderPath.replace(/\/$/, "")}/${filename}` : filename;

  console.log("📤 Uploading to Supabase:", { pathInBucket, mimeType });

  // 4. Upload
  try {
    const { error } = await supabase.storage.from(bucket).upload(pathInBucket, blob, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) {
      console.error("🛑 Supabase upload error:", error);
      throw new Error(error.message);
    }
  } catch (err: any) {
    console.error("❌ Upload threw an exception:", err.message || err);
    throw new Error("Upload to Supabase Storage failed.");
  }

  // 5. Public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(pathInBucket);
  if (!data?.publicUrl) {
    console.error("❌ Failed to get public URL");
    throw new Error("Unable to retrieve public URL.");
  }

  return data.publicUrl;
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}