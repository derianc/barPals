import React, { useState } from "react";
import {
  Alert,
  Image,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useUser } from "@/contexts/userContext";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import { Text as AppText } from "@/components/ui/text";
import OwnerOfferHeader from "@/components/shared/custom-header/ownerOfferHeader";

import * as ImagePicker from "expo-image-picker";
import { analyzeReceipt } from "@/services/formRecognizerService";
import { parseAddressComponents, sanitizeText, generateVenueHash } from "@/utilities";
import { uploadVenueImage, createVenueWithOwner, isVenueDuplicate } from "@/services/sbVenueService";
import { geocodeAddress } from "@/services/sbEdgeFunctions";
import { uploadReceipt } from "@/services/sbFileService";

const RegisterVenueScreen = () => {
  const { user } = useUser();
  const [image, setImage] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const handlePickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0]);
      await extractVenueFromReceipt(result.assets[0]);
    }
  };

  const extractVenueFromReceipt = async (imageAsset: any) => {
    if (!user?.id) return;
    setSubmitting(true);

    try {
      console.log("📤 Uploading receipt...");
      const publicUrl = await uploadReceipt(imageAsset.uri, "user-receipts");
      console.log("✅ Uploaded to:", publicUrl);

      const analyzeResult = await analyzeReceipt(publicUrl);
      const doc = analyzeResult?.documents?.[0];

      const merchantName = doc?.fields?.MerchantName?.content ?? "UNKNOWN";
      const merchantAddress = doc?.fields?.MerchantAddress?.content ?? "";
      if (!merchantName || !merchantAddress) throw new Error("Unable to extract venue info from receipt");

      const fullAddress = sanitizeText(merchantAddress)!;
      const parsed = parseAddressComponents(fullAddress);
      const coords = await geocodeAddress(fullAddress);
      if (!coords) throw new Error("Could not resolve coordinates");

      const venueHash = await generateVenueHash(merchantAddress);

      const isDuplicate = await isVenueDuplicate(venueHash);
      if (isDuplicate) {
        Alert.alert("⚠️ Already Exists", "This venue is already registered.");
        setImage(null);
        return;
      }

      setPreview({
        name: merchantName,
        fullAddress,
        ...parsed,
        latitude: coords.latitude,
        longitude: coords.longitude,
        venue_hash: venueHash,
      });

    } catch (err: any) {
      console.error("❌ Extraction failed:", err);
      Alert.alert("Error", err.message || "Failed to process receipt.");
      setImage(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmVenue = async () => {
    if (!user?.id || !preview) return;

    setSubmitting(true);
    try {
      const venueData = {
        name: preview.name,
        address_line1: preview.street_line,
        city: preview.city,
        state: preview.state,
        postal_code: preview.postal,
        latitude: preview.latitude,
        longitude: preview.longitude,
        venue_hash: preview.venue_hash,
        phone: null,
        email: null,
        website_url: null,
        logo_url: "",
        cover_image_url: "",
      };

      await createVenueWithOwner(venueData, user.id);
      Alert.alert("✅ Success", "Venue registered successfully.");
      setImage(null);
      setPreview(null);
    } catch (err: any) {
      console.error("❌ Venue creation failed:", err);
      Alert.alert("Error", err.message || "Failed to create venue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <OwnerOfferHeader />
      <View style={styles.container}>
        <VStack space="lg">
          <AppText style={styles.label}>Scan Receipt</AppText>
          <Pressable onPress={handlePickReceipt} style={styles.imageUpload}>
            <AppText style={styles.uploadText}>
              {image ? "Change Receipt" : "Upload Receipt Image"}
            </AppText>
            {image && <Image source={{ uri: image.uri }} style={styles.logoPreview} />}
          </Pressable>

          {preview && (
            <View style={styles.previewCard}>
              <AppText style={styles.previewLabel}>Venue Name</AppText>
              <TextInput
                style={styles.previewInput}
                value={preview.name}
                onChangeText={(text) =>
                  setPreview((prev: any) => ({ ...prev, name: text }))
                }
                placeholder="Venue name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.previewText}>
                {preview.street_line}, {preview.city}, {preview.state} {preview.postal}
              </Text>
              <Text style={styles.previewText}>Lat: {preview.latitude}</Text>
              <Text style={styles.previewText}>Lng: {preview.longitude}</Text>

              <Pressable onPress={handleConfirmVenue} style={styles.confirmButton}>
                <AppText style={styles.submitText}>
                  {submitting ? "Submitting..." : "Confirm & Register"}
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setPreview(null);
                  setImage(null);
                }}
                style={styles.reuploadButton}
              >
                <AppText style={styles.reuploadText}>Scan Another Receipt</AppText>
              </Pressable>
            </View>
          )}


          {submitting && !preview && (
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={{ color: "#E2E8F0", marginTop: 8 }}>Processing receipt...</Text>
            </View>
          )}
        </VStack>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: "#000000",
    flexGrow: 1,
    paddingBottom: 32,
  },
  container: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 20,
    margin: 16,
  },
  label: {
    fontWeight: "500",
    color: "#E2E8F0",
    marginBottom: 6,
  },
  imageUpload: {
    backgroundColor: "#334155",
    borderColor: "#475569",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  uploadText: {
    fontWeight: "600",
    color: "#60A5FA",
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  previewText: {
    color: "#CBD5E1",
    fontSize: 14,
    marginBottom: 2,
  },
  confirmButton: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  previewLabel: {
    fontWeight: "500",
    color: "#E2E8F0",
    marginBottom: 4,
    marginTop: 10,
  },
  previewInput: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#F8FAFC",
    marginBottom: 10,
  },
  reuploadButton: {
    marginTop: 12,
    alignItems: "center",
  },
  reuploadText: {
    color: "#60A5FA",
    fontWeight: "500",
  },
});

export default RegisterVenueScreen;
