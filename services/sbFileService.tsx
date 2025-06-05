import { supabase } from "@/supabase";

// Replace with your Supabase project details
const SUPABASE_PROJECT_URL = "https://pgswimjajpjupnafjosl.supabase.co";
const STORAGE_API_URL = `${SUPABASE_PROJECT_URL}/storage/v1/object`;

export async function uploadReceipt(
  localUri: string,
  bucket: string,
  folderPath?: string
): Promise<string> {
  console.log("📷 Uploading receipt:", localUri);

  // Get current session token
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    console.error("❌ No access token available");
    throw new Error("User not authenticated.");
  }

  // 1. Determine file extension and MIME type
  const extension = localUri.split(".").pop()?.toLowerCase() || "jpg";
  const mimeType =
    extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : extension === "png"
      ? "image/png"
      : extension === "pdf"
      ? "application/pdf"
      : "application/octet-stream";

  // 2. Generate a unique filename
  const filename = `${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`;
  const objectKey = folderPath
    ? `${folderPath.replace(/\/$/, "")}/${filename}`
    : filename;

  const uploadUrl = `${STORAGE_API_URL}/${bucket}/${objectKey}`;

  // 3. Prepare FormData
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    type: mimeType,
    name: filename,
  } as any);

  console.log("📤 Uploading to Supabase:", { mimeType, objectKey });

  // 4. Upload using fetch and bearer token
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("🛑 Upload failed:", errText);
    throw new Error("Upload to Supabase Storage failed.");
  }

  console.log("✅ Upload successful:", objectKey);

  // 5. Return public URL (assuming the bucket is public)
  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${objectKey}`;
}
