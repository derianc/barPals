import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Text,
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
import { format, parse, isValid } from "date-fns";
import { useUser } from "@/contexts/userContext";
import { findVenueByHash } from "@/services/sbVenueService";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';


type CameraViewProps = {
  onCapture: (uri: string) => void;
};

type FlashMode = 'off' | 'on' | 'auto';

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
        // setCameraRef(null);     // Clean up cameraRef on unfocus
        setPhotoUri(null);      // Optionally reset preview
      };
    }, [])
  );

  const isReceiptValid = (txData: TransactionData | undefined): boolean => {
    if (!txData) {
      console.warn("Invalid receipt: txData is undefined");
      return false;
    }

    const requiredFields: Record<string, any> = {
      merchantName: txData.merchantName,
      total: txData.total,
      transactionDate: txData.transactionDate,
      transactionTime: txData.transactionTime,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.toUpperCase().trim() === "UNKNOWN") ||
        (typeof value === "string" && value.trim() === "")
      ) {
        console.warn(`Invalid receipt: ${key} is invalid (${value})`);
        return false;
      }
    }

    return true;
  };

  const handleCapture = async () => {
    console.log('taking picture');
    
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
      const photo = await cameraRef.current.takePhoto({
        flash: flash,
      });
      if (!photo.path) return;

      // Show preview immediately
      const fileUri = `file://${photo.path}`;
      onCapture(fileUri);
      setPhotoUri(fileUri);
      setLoading(true);

      // 2) Upload local file to storage → get public URL
      const publicUrl = await uploadReceipt(fileUri, "user-receipts");

      // 3) Call analyzeReceipt(documentUrl: string)
      const analysisResult = await analyzeReceipt(publicUrl);

      // 4) Extract typed TransactionData from the raw AnalyzeResult
      const txData = await extractReceiptDetails(analysisResult, publicUrl);

      const isValid = isReceiptValid(txData);
      if (!isValid) {
        setBottomHeader("Error!")
        setBottomText("Invalid Receipt Format!")
        setBottomSuccess(false)
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
      const isInsertSuccessful = await insertReceiptDetails(user.id, txData);
      if (isInsertSuccessful) {
        setBottomHeader("Success!")
        setBottomText(`Receipt for ${txData.merchantName} uploaded successfully!`)
        setBottomSuccess(true)
      } else {
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

    const knownDateFormats = [
      "MM/dd/yyyy",
      "MM/dd/yy",
      "M/d/yy",
      "M/d/yyyy",
      "yyyy-MM-dd",
      "MM-dd-yyyy",
      "dd-MM-yyyy",
      "dd MMM yyyy",
      "dd-MMM-yyyy",
      "MMMM d. yyyy",
      "MMMM d, yyyy",
    ];

    let normalized = dateString.trim();

    // 🛠 Fix 2-digit year edge case (e.g. 6/23/25 → 6/23/2025)
    const mmddyyMatch = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (mmddyyMatch) {
      const [_, m, d, y] = mmddyyMatch;
      const fullYear = parseInt(y) > 30 ? `19${y}` : `20${y}`; // heuristic
      normalized = `${m}/${d}/${fullYear}`;
      console.log("📅 Normalized short year to:", normalized);
    }

    for (const fmt of knownDateFormats) {
      try {
        const parsed = parse(normalized, fmt, new Date());
        const isValidDate = isValid(parsed);
        console.log(`🔍 Tried format '${fmt}' → ${isValidDate ? "✅ Success" : "❌ Invalid"}`, parsed);

        if (isValidDate) {
          const formatted = format(parsed, "MM-dd-yyyy");
          console.log(`✅ Parsed using '${fmt}' →`, formatted);
          return formatted;
        }
      } catch (e) {
        console.error(`💥 Error parsing with '${fmt}':`, e);
      }
    }

    console.warn("⚠️ Skipping invalid transactionDate:", dateString);
    return "";
  }

  function formatTime(timeString: string): string {
    console.log("⏰ Parsing timeString:", timeString);
    if (!timeString) {
      console.warn("⚠️ Empty time string provided");
      return "";
    }

    const cleaned = timeString.trim().toUpperCase().replace(/\s+/g, " ");
    console.log("🧼 Normalized timeString:", cleaned);

    const knownTimeFormats = [
      "h:mm:ssa",     // e.g., 2:54:33pm
      "h:mma",        // e.g., 2:54pm
      "hh:mma",       // e.g., 02:54pm
      "hmmssa",
      "hmm a",
      "h:mm:ss a",
      "h:mm a",
      "hh:mm:ss a",
      "hh:mm a",
      "H:mm:ss",
      "H:mm",
      "HHmmss",
      "MMMM d yyyy",
      "d MMMM yyyy",
      "d MMM yyyy",
      "d-MMMM-yyyy",
      "d-MMM-yyyy",
    ];

    for (const fmt of knownTimeFormats) {
      try {
        const parsed = parse(cleaned, fmt, new Date());
        const isValidTime = isValid(parsed);
        console.log(`🔍 Tried format '${fmt}' → ${isValidTime ? "✅ Success" : "❌ Invalid"}`, parsed);

        if (isValidTime) {
          const formatted = format(parsed, "HH:mm:ss");
          console.log(`✅ Parsed time → ${formatted}`);
          return formatted;
        }
      } catch (err) {
        console.error(`💥 Error parsing time with format '${fmt}':`, err);
      }
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

    let merchantName = getContent("MerchantName");
    const merchantAddress = getContent("MerchantAddress");

    // look up venue based on address


    // Lookup venue name if merchantName is blank but address is provided
    // console.log("🔍 Merchant Name:", merchantName);
    // if (!merchantName && merchantAddress) {
    //   console.log("🔍 Merchant Address provided, looking up venue by address hash:", merchantAddress);
    //   const venue = await findVenueByHash(merchantAddress); // merchant address will be hashed in service call
    //   console.log("🔍 Found venue by address hash:", venue);
    //   if (venue?.name) {
    //     merchantName = venue.name;
    //   }
    // }

    // 2) Construct TransactionData
    const tx: TransactionData = {
      merchantName: merchantName,
      merchantAddress: getContent("MerchantAddress") || "Unknown",
      transactionDate: formatDate(getContent("TransactionDate")),
      transactionTime: formatTime(getContent("TransactionTime")),

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
      {device && isFocused && hasPermission === true && (
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
        <View style={styles.previewOverlay}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <View style={styles.spinnerOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </View>
      )}

      {/* Loading Spinner Overlay */}
      {loading && (
        <View style={styles.spinnerOverlay}>
          <ActivityIndicator size="large" color="#fff" />
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
    width: "90%",
    height: "90%",
    resizeMode: "cover",
    opacity: 0.9,
  },

  spinnerOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
});
