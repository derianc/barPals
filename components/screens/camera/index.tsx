// CameraComponent.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Text,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { analyzeReceipt } from "@/services/formRecognizerService";
import {
  AnalyzeResult,
  AnalyzedDocument,
  DocumentArrayField,
  DocumentField,
} from "@azure/ai-form-recognizer";
import { TransactionData, TransactionItem } from "@/data/models/transactionModel";
import { uploadReceipt } from "@/services/sbFileService";
import { insertReceiptDetails } from "@/services/sbReceiptService";

type CameraViewProps = {
  onCapture: (uri: string) => void;
};

// Stub: replace with your real upload‐to‐storage implementation
async function uploadImageAsync(localUri: string): Promise<string> {
  // Upload `localUri` (file://…) to Firebase, Azure Blob, etc.
  // Return a fully public HTTPS URL for the image.
  return "https://firebasestorage.googleapis.com/v0/b/bar-o-meter-1bacd.firebasestorage.app/o/images%2F020483d0-1327-4e70-8826-e7c800eaa723.jpg?alt=media&token=3f96d9d3-1ed6-425a-96c4-4c7805325413";
}

export default function CameraComponent({ onCapture }: CameraViewProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<any | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef) return;

    try {
      setErrorMessage(null);

      // 1) Take picture (no base64; we'll upload the file itself)
      const photo = await cameraRef.takePictureAsync({
        base64: false,
        quality: 0.8,
      });
      onCapture(photo.uri);
      if (!photo.uri) return;

      // Show preview immediately
      setPhotoUri(photo.uri);
      setLoading(true);

      // 2) Upload local file to storage → get public URL
      const publicUrl = await uploadReceipt(photo.uri, "user-receipts");

      // 3) Call analyzeReceipt(documentUrl: string)
      const analysisResult = await analyzeReceipt(publicUrl);

      // 4) Extract typed TransactionData from the raw AnalyzeResult
      const txData = extractReceiptDetails(analysisResult, publicUrl);

      // 5) Save to Supabase
      await insertReceiptDetails(txData);

      // 5) Save to state for rendering
      setTransactionData(txData);
    } catch (err: any) {
      console.error("❌ handleCapture error:", err);
      setErrorMessage(err.message || "Failed to analyze receipt.");
    } finally {
      setLoading(false);
    }
  };

  function formatPrice(total: string | undefined): number | null {
    if (!total) return null; // Handle undefined or empty string
    const cleaned = total.replace(/[^0-9.-]+/g, ""); // Remove non-numeric characters
    const parsed = parseFloat(cleaned); // Convert to floating-point number
    return isNaN(parsed) ? null : parsed; // Return null if parsing fails
  }

  function extractReceiptDetails(receipt: AnalyzeResult<AnalyzedDocument> | undefined, imageUrl: string): TransactionData {
    if (!receipt || !receipt.documents || receipt.documents.length === 0) {
      throw new Error("Invalid receipt data.");
    }

    const document = receipt.documents[0];
    const fields = document.fields;

    // Helper to get .content string from a DocumentField
    const getContent = (name: string): string => {
      const f = fields[name] as DocumentField | undefined;
      return f?.content ?? "";
    };

    // 1) Extract the "Items" array field (if it exists)
    const items = receipt?.documents[0]?.fields?.Items as DocumentArrayField

    // 2) Construct TransactionData
    const tx: TransactionData = {
      merchantName: getContent("MerchantName") || "Unknown",
      merchantAddress: getContent("MerchantAddress") || "Unknown",
      transactionDate: getContent("TransactionDate"),
      transactionTime: getContent("TransactionTime"),
      total: formatPrice(getContent("Total")) || 0,
      createdAt: new Date().toISOString(),
      receiptUri: imageUrl,

      // Custom fields (fill in as needed)
      customerName: "",
      transaction: "",
      duplicateKey: "",

      Items: items.values.map((item: any): TransactionItem => ({
        name: item.properties?.Description?.content || "Unknown Item",
        quantity: item.properties?.Quantity?.content || "1",
        price: formatPrice(item.properties?.TotalPrice?.content) || 0,
      }))
    };

    return tx;
  }

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <CameraView style={styles.camera} ref={(ref: any) => setCameraRef(ref)}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <Ionicons name="camera" size={36} color="#fff" />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />

          {loading && (
            <View style={styles.spinnerOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {transactionData && (
            <View style={styles.resultContainer}>
              <Text style={styles.receiptLine}>Merchant: {transactionData.merchantName}</Text>
              <Text style={styles.receiptLine}>Address: {transactionData.merchantAddress}</Text>
              <Text style={styles.receiptLine}>Date: {transactionData.transactionDate}</Text>
              <Text style={styles.receiptLine}>Time: {transactionData.transactionTime}</Text>
              <Text style={styles.receiptLine}>Total: ${transactionData.total?.toFixed(2)}</Text>
              <Text style={styles.receiptLine}>Line Items:</Text>
              {transactionData.Items.map((it, idx) => (
                <Text key={idx} style={styles.receiptLine}>
                  • {it.name} | Qty: {it.quantity} | ${it.price}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 20,
  },
  previewContainer: { flex: 1, alignItems: "center", padding: 16 },
  previewImage: { width: "90%", height: "40%", borderRadius: 10 },
  spinnerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
  },
  resultContainer: { marginTop: 16, width: "100%" },
  receiptLine: { marginVertical: 2, fontSize: 16 },
  errorText: { color: "red", fontSize: 16 },
  captureButton: {
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "tomato",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});
