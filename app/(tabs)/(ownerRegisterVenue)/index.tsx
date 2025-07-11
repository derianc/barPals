import React, { useState } from "react";
import {
  ScrollView,
  TextInput,
  Alert,
  Image,
  View,
  Text,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { VStack } from "@/components/ui/vstack";
import { Text as AppText } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import OwnerOfferHeader from "@/components/shared/custom-header/ownerOfferHeader";

import { useUser } from "@/contexts/userContext";
import { geocodeAddress } from "@/services/geocodingService";
import { uploadVenueImage, createVenueWithOwner } from "@/services/sbVenueService";
import { generateVenueHash, sanitizeAddress, } from "@/utilities";
import { GooglePlacesAutocomplete, PlaceType } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import AddressAutocompleteInput from "@/components/AddressAutoCompleteInput/AddressAutoCompleteInput";

type SuggestionProps = {
  data: any;
  index: number;
};

const AddressSuggestionRow = ({ data }: SuggestionProps) => {
  const main = data?.structured_formatting?.main_text;
  const secondary = data?.structured_formatting?.secondary_text;

  if (!main) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ color: "#F87171" }}>Invalid suggestion</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 12 }}>
      <Text style={{ color: "#F8FAFC", fontWeight: "600" }}>{main}</Text>
      {secondary ? (
        <Text style={{ color: "#94A3B8" }}>{secondary}</Text>
      ) : null}
    </View>
  );
};


const RegisterVenueScreen = () => {
  const [name, setName] = useState("Test Store");
  const [address, setAddress] = useState("3244 River Narrows Rd");
  const [city, setCity] = useState("Hilliard");
  const [state, setState] = useState("OH");
  const [postalCode, setPostalCode] = useState("43206");
  const [phone, setPhone] = useState("614.599.9954");
  const [email, setEmail] = useState("derianc@gmail.com");
  const [website, setWebsite] = useState("");

  const [logo, setLogo] = useState<any>(null);
  const [cover, setCover] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const { user } = useUser();

  const pickImage = async (setter: (file: any) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setter(result.assets[0]);
    }
  };

  const resetForm = () => {
    setName("");
    setAddress("");
    setCity("");
    setState("");
    setPostalCode("");
    setPhone("");
    setEmail("");
    setWebsite("");
    setLogo(null);
    setCover(null);
    setLatitude(null);
    setLongitude(null);
  };

  const handleSubmit = async () => {
    if (!name || !address || !city || !state || !postalCode) {
      Alert.alert("Missing Fields", "Please fill out all required fields.");
      return;
    }
    if (latitude === null || longitude === null) {
      Alert.alert("Location Error", "Could not resolve coordinates for address.");
      return;
    }

    if (!user?.id) return;

    setSubmitting(true);

    try {
      const fullAddress = `${address}, ${city}, ${state} ${postalCode}`;
      const coords = await geocodeAddress(fullAddress);
      if (!coords) throw new Error("Geocoding failed.");

      const venueHash = await generateVenueHash(fullAddress ?? "");
      console.log("🔑 Venue registration hash:", venueHash);

      let logoUrl = "";
      let coverUrl = "";

      if (logo) {
        const ext = logo.uri.split(".").pop();
        const path = `logos/${Date.now()}.${ext}`;
        const resp = await fetch(logo.uri);
        const blob = await resp.blob();
        logoUrl = await uploadVenueImage(blob as any, path);
      }

      if (cover) {
        const ext = cover.uri.split(".").pop();
        const path = `covers/${Date.now()}.${ext}`;
        const resp = await fetch(cover.uri);
        const blob = await resp.blob();
        coverUrl = await uploadVenueImage(blob as any, path);
      }

      const venueData = {
        name,
        address_line1: address,
        city,
        state,
        postal_code: postalCode,
        phone,
        email,
        website_url: website,
        latitude,
        longitude,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        venue_hash: venueHash,
      };

      await createVenueWithOwner(venueData, user?.id);

      Alert.alert("Success", "Venue registered successfully.");
      resetForm();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Venue registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <OwnerOfferHeader />
      <View style={styles.container}>
        <VStack space="lg">
          {/* Venue Name */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Venue Name</AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter Venue Name"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Autocomplete Address Field */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Address</AppText>
            <AddressAutocompleteInput
              onSelect={(item) => {
                const c = item.components;
                setAddress(`${c.house_number ?? ""} ${c.road ?? ""}`.trim());
                setCity(c.city || c.town || c.village || "");
                setState(c.state || "");
                setPostalCode(c.postcode || "");
                setLatitude(item.lat);
                setLongitude(item.lng);
              }}
            />
          </View>



          {/* Logo Upload */}
          <Pressable onPress={() => pickImage(setLogo)} style={styles.imageUpload}>
            <AppText style={styles.uploadText}>
              {logo ? "Change Logo" : "Upload Logo"}
            </AppText>
            {logo && <Image source={{ uri: logo.uri }} style={styles.logoPreview} />}
          </Pressable>

          {/* Cover Upload */}
          <Pressable onPress={() => pickImage(setCover)} style={styles.imageUpload}>
            <AppText style={styles.uploadText}>
              {cover ? "Change Cover Image" : "Upload Cover Image"}
            </AppText>
            {cover && (
              <Image
                source={{ uri: cover.uri }}
                style={styles.coverPreview}
                resizeMode="cover"
              />
            )}
          </Pressable>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
          >
            <AppText style={styles.submitText}>
              {submitting ? "Submitting..." : "Register Venue"}
            </AppText>
          </Pressable>
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
    backgroundColor: "#1E293B", // dark blue-gray card
    padding: 16,
    borderRadius: 20,
    margin: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "500",
    color: "#E2E8F0",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
    color: "#F8FAFC",
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
  coverPreview: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#475569",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RegisterVenueScreen;
