import React, { useState, useRef, } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Text
} from "react-native";
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
import { insertReceiptDetails, isReceiptDuplicate } from "@/services/sbCoreReceiptService";
import RBSheet from "react-native-raw-bottom-sheet"
import SuccessSheet from "./BottomSheet";
import { useUser } from "@/contexts/userContext";
import { findVenueByHash } from "@/services/sbVenueService";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import * as chrono from "chrono-node";
import { format as formatDateFns } from "date-fns";
import { geocodeAddress } from "@/services/sbEdgeFunctions";
import LottieView from "lottie-react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

type CameraViewProps = {
  onCapture: (uri: string) => void;
};

type FlashMode = 'off' | 'on' | 'auto';

type ReceiptValidationResult = { valid: boolean; reason?: string };

export default function CameraComponent({ onCapture }: CameraViewProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [flash, setFlash] = useState<FlashMode>('off'); 
  const cameraRef = useRef<Camera | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomSheetRef = useRef<any>(null);
  const [bottomSheetHeader, setBottomHeader] = useState("Failed");
  const [bottomSheetText, setBottomText] = useState("Receipt Upload Failed");
  const [bottomSheetSuccess, setBottomSuccess] = useState(false);
  const isFocused = useIsFocused();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [torch, setTorch] = useState<'on' | 'off'>('off');

  const statusAnimations: Record<string, any> = {
    upload: require("@/assets/animations/upload.json"),
    analyze: require("@/assets/animations/ai.json"),
    duplicate: require("@/assets/animations/warning.json"),
    save: require("@/assets/animations/save2.json"),
    success: require("@/assets/animations/success.json"),
    error: require("@/assets/animations/error.json"),
  };
  const [statusText, setStatusText] = useState("");
  const [statusKey, setStatusKey] = useState<keyof typeof statusAnimations>("capture");


  const { user } = useUser();

  useFocusEffect(
      React.useCallback(() => {
      (async () => {
        const permission = await requestPermission();
        if (!permission) {
          console.log('Camera permission denied');
        }
      })();

      requestPermission();

      return () => {
        setPhotoUri(null);      // Optionally reset preview
      };
    }, [])
  );

  const isReceiptValid = (txData: TransactionData | undefined): ReceiptValidationResult => {
  if (!txData) {
    console.warn("Invalid receipt: txData is undefined");
    return { valid: false, reason: "No data extracted from receipt" };
  }

  const requiredFields: Record<string, any> = {
    "Merchant Name": txData.merchantName,
    "Total Amount": txData.total,
    "Transaction Date": txData.transactionDate,
    "Transaction Time": txData.transactionTime,
  };

  for (const [label, value] of Object.entries(requiredFields)) {
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.toUpperCase().trim() === "UNKNOWN") ||
      (typeof value === "string" && value.trim() === "")
    ) {
      console.warn(`Invalid receipt: ${label} is missing or invalid (${value})`);
      return { valid: false, reason: `${label} is missing or invalid` };
    }
  }

  return { valid: true };
};

  const handleCapture = async () => {
    
    if (!cameraRef.current) {
      console.warn("❌ Camera ref not available");
      return;
    }

    if (!user?.id) {
      console.warn("⚠️ No user found — skipping insert.");
      return;
    }

    try {
      // 1) Take picture (no base64; we'll upload the file itself)
      const photo = await cameraRef.current.takePhoto({ flash: flash, });
      if (!photo.path) return;

      // 🔦 Turn off torch after capture
      setTorch('off');

      // Show preview immediately
      const fileUri = `file://${photo.path}`;

      // 🧠 Compress and resize
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        fileUri,
        [{ resize: { width: 1000 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      const resizedUri = manipulatedImage.uri;
      console.log("📦 Resized image:", resizedUri);

      // 🧹 Delete original full-size image to save space
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (deleteErr) {
        console.warn("🧹 Could not delete original image:", deleteErr);
      }

      onCapture(resizedUri);
      setPhotoUri(resizedUri);
      setLoading(true);

      // 2) Upload local file to storage → get public URL
      setStatusKey("upload");
      const publicUrl = await uploadReceipt(resizedUri, "user-receipts");

      // 3) Call analyzeReceipt(documentUrl: string)
      setStatusKey("analyze");
      const analysisResult = await analyzeReceipt(publicUrl);

      // 4) Extract typed TransactionData from the raw AnalyzeResult
      const txData = await extractReceiptDetails(analysisResult, publicUrl);

      const { valid, reason } = isReceiptValid(txData);
      if (!valid) {
        setBottomHeader("Invalid Receipt");
        setBottomText(reason || "Missing required fields");
        setBottomSuccess(false);
        bottomSheetRef.current?.open();
        return;
      }

      // 4.5) Duplicate check
      const isDuplicate = await isReceiptDuplicate(txData);
      if (isDuplicate) {
        setBottomHeader("Error!")
        setBottomText("Duplicate Receipt Detected!")
        setBottomSuccess(false)
        bottomSheetRef.current?.open();
        return
      }

      // 5) Save to Supabase
      // setStatusKey("save");
      const isInsertSuccessful = await insertReceiptDetails(user.id, txData);
      if (isInsertSuccessful) {
        setStatusKey("success");

        setBottomHeader("Success!")
        setBottomText(`Receipt for ${txData.merchantName} uploaded successfully!`)
        setBottomSuccess(true)
      } else {
        setStatusKey("error");

        setBottomHeader("Error!")
        setBottomText("Unable To Save Receipt Details")
        setBottomSuccess(false)
      }

      // 6) open bottom sheet with results
      bottomSheetRef.current?.open();

    } catch (err: any) {
      console.error("❌ handleCapture error:", err);
      bottomSheetRef.current?.open();
    } finally {
      setLoading(false);

      setTimeout(() => {
        setPhotoUri(null);

        // hide bottom sheet
        bottomSheetRef.current?.close();
      }, 3000);
    }
  };

  function formatPrice(total: string | undefined): number | null {
    if (!total) return null; // Handle undefined or empty string
    const cleaned = total.replace(/[^0-9.-]+/g, ""); // Remove non-numeric characters
    const parsed = parseFloat(cleaned); // Convert to floating-point number
    return isNaN(parsed) ? null : parsed; // Return null if parsing fails
  }

  function formatDate(dateString: string): string {
    console.log("📅 Parsing transactionDate:", dateString);
    if (!dateString) {
      console.warn("⚠️ Empty date string provided");
      return "";
    }

    try {
      // Normalize 2-digit year formats like "Jun'25" → "Jun 2025"
      let normalized = dateString.trim().replace(/[\u2018\u2019']/g, "'"); // normalize quotes
      normalized = normalized.replace(/'(\d{2})\b/g, (_, yy) => {
        const fullYear = parseInt(yy, 10);
        return fullYear > 30 ? `19${yy}` : `20${yy}`;
      });

      const results = chrono.parse(normalized, new Date(), { forwardDate: true });
      if (results.length > 0) {
        const parsedDate = results[0].start.date();
        const formatted = formatDateFns(parsedDate, "yyyy-MM-dd");
        console.log(`✅ Parsed date →`, formatted);
        return formatted;
      }
    } catch (e) {
      console.error("💥 Chrono parsing error:", e);
    }

    console.warn("⚠️ Skipping invalid transactionDate:", dateString);
    return "";
  }

  function formatTime(timeString: string, baseDate?: string): string {
    console.log("⏰ Parsing timeString:", timeString);
    if (!timeString) {
      console.warn("⚠️ Empty time string provided");
      return "";
    }

    try {
      const referenceDate = baseDate ? new Date(baseDate) : new Date();
      timeString = timeString.replace(/(\d)([AP])$/, "$1$2M").replace(/(\d)([AP]M)$/, "$1 $2");
      const results = chrono.parse(timeString, referenceDate);

      if (results.length > 0 && results[0].start.isCertain("hour")) {
        const parsedTime = results[0].start.date();
        const formatted = formatDateFns(parsedTime, "HH:mm:ss");
        console.log("✅ Parsed time →", formatted);
        return formatted;
      }
    } catch (e) {
      console.error("💥 Chrono parse error:", e);
    }

    console.warn("⚠️ Skipping invalid time:", timeString);
    return "";
  }

  async function extractReceiptDetails(receipt: AnalyzeResult<AnalyzedDocument> | undefined, imageUrl: string): Promise<TransactionData> {
    if (!receipt || !receipt.documents || receipt.documents.length === 0) {
      throw new Error("Invalid receipt data.");
    }

    const document = receipt.documents[0];
    const fields = document.fields;

    // console.log('tx data', JSON.stringify(document, null, 2))

    // Helper to get .content string from a DocumentField
    const getContent = (name: string): string => {
      const f = fields[name] as DocumentField | undefined;
      return f?.content ?? "";
    };

    // 1) Extract the "Items" array field (if it exists)
    const items = receipt?.documents[0]?.fields?.Items as DocumentArrayField

    let merchantName = "";
    const merchantAddress = getContent("MerchantAddress");

    if (!merchantAddress) {
      console.warn("⚠️ No merchant address found — skipping");
      return {
        merchantName: "",
        merchantAddress: "",
        transactionDate: "",
        transactionTime: "",
        total: 0,
        createdAt: new Date().toISOString(),
        receiptUri: imageUrl,
        customerName: "",
        transaction: "",
        duplicateKey: "",
        Items: [],
      };
    }

    // get geoDetails from provided address
    const geo = await geocodeAddress(merchantAddress);

    // see if venue has been registered
    const venue = await findVenueByHash(geo.venueHash);
    if (venue && venue.name) {
      console.log("Using receipt name from venue")
      merchantName = venue.name;
    }
    else {
      console.log("Using receipt name from image scan")
      merchantName = getContent("MerchantName") ?? "UNKNOWN";
    }
    const rawDate = getContent("TransactionDate");
    const rawTime = getContent("TransactionTime");

    // 2) Construct TransactionData
    const tx: TransactionData = {
      merchantName: merchantName,
      merchantAddress: merchantAddress,
      transactionDate: formatDate(rawDate),
      transactionTime: formatTime(rawTime, formatDate(rawDate)),

      total: formatPrice(getContent("Total")) || 0,
      createdAt: new Date().toISOString(),
      receiptUri: imageUrl,

      // Custom fields (fill in as needed)
      customerName: "",
      transaction: "",
      duplicateKey: "",

      Items: Array.isArray(items?.values)
        ? items.values.map((item: any): TransactionItem => ({
          item_name: item.properties?.Description?.content || "Unknown Item",
          quantity: item.properties?.Quantity?.content || "1",
          price: formatPrice(item.properties?.TotalPrice?.content) || 0,
        }))
        : [],
    };

    return tx;
  }

  return (
    <View style={styles.container}>
      {device && isFocused && hasPermission === true && !photoUri && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          photo={true}
          torch={torch}
        />
      )}

      {/* 🔦 Flash Button */}
      <View style={styles.flashButtonContainer}>
        <TouchableOpacity
          onPress={() => setTorch(prev => (prev === 'on' ? 'off' : 'on'))}
          style={styles.flashButton}
        >
          <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 📸 Capture Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <Ionicons name="camera" size={36} color="#fff" />
        </TouchableOpacity>
      </View>

      <RBSheet
        ref={bottomSheetRef}
        height={250}
        openDuration={300}
        customStyles={{
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
          },
        }}
      >
        <SuccessSheet
          headerText={bottomSheetHeader}
          bodyText={bottomSheetText}
          messageSuccess={bottomSheetSuccess} />

      </RBSheet>

      {/* Show preview image while loading */}
      {loading && photoUri && (
        <View style={styles.spinnerOverlay}>
          {/* Preview image fills background */}
          <Image source={{ uri: photoUri }} style={styles.previewImage} />

          {/* Lottie animation centered over image */}
          <View style={styles.loaderOverlay}>
            <LottieView
              source={statusAnimations[statusKey]}
              autoPlay
              loop
              style={styles.loader}
            />
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'black'
  },
  camera: {
    flex: 1
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    zIndex: 10,
  },
  previewContainer: {
    flex: 1,
    alignItems: "center",
    padding: 16
  },
  resultContainer: {
    marginTop: 16,
    width: "100%"
  },
  receiptLine: {
    fontSize: 14,
    color: "#444",
  },
  errorText: {
    color: "red",
    fontSize: 16
  },
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
  flashButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    zIndex: 10,
  },
  flashButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 8,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  details: {
    gap: 4,
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  }, 
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 1,
    zIndex: 10,
  },
  spinnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // optional dark overlay
    zIndex: 20,
  },

  loaderOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 25,
  },

  loader: {
    width: 120,
    height: 120,
  },
});
