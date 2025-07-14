import React, { useState } from "react";
import {
  ScrollView,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from "react-native";
import OfferStepContainer from "@/components/ui/offerStepContainer/offerStepContainer";
import OwnerOfferHeader from "@/components/shared/custom-header/ownerOfferHeader";
import { format } from "date-fns";
import DatePicker from "react-native-date-picker";
import TargetAudienceSection from "@/components/screens/ownerOffer/targetAudienceComponent";
import { submitOffer } from "@/services/sbOfferService";
// import { getVenueForUser } from "@/services/sbVenueService";
import { useUser } from "@/contexts/userContext";
import { useRouter } from "expo-router";
import { processOffer } from "@/services/sbEdgeFunctions";
import { useVenue } from "@/contexts/venueContex";

const CreateOfferScreen = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState<Date>(new Date());
  const [validUntil, setValidUntil] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickerType, setPickerType] = useState<"from" | "until" | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const { user } = useUser();
  const router = useRouter();
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [spend, setSpend] = useState<number>(25);
  const [distance, setDistance] = useState<number>(5);
  const [sendNow, setSendNow] = useState(true);
  const { selectedVenue } = useVenue();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!user?.id) {
        console.error("User not authenticated");
        return;
      }

      const venueId = selectedVenue?.id ;
      if (!venueId) {
        Alert.alert("No venue selected", "Please select a venue before creating an offer.");
        setIsSubmitting(false);
        return;
      }
      
      const targetCriteria = {
        lastVisited: selectedChips,
        minSpend: spend,
        maxDistance: distance
      };

      const validFromUtc = new Date(validFrom.getTime() - validFrom.getTimezoneOffset() * 60000);
      const validUntilUtc = new Date(validUntil.getTime() - validUntil.getTimezoneOffset() * 60000);

      const offer = await submitOffer({
        venueId,
        title,
        description,
        imageUrl: "", 
        validFrom: validFromUtc,
        validUntil: validUntilUtc,
        targetCriteria,
        scheduledAt: sendNow ? new Date() : validFrom, 
      });

      console.log("✅ Offer created:", offer);

      if (sendNow && offer?.id) {
        await processOffer(offer.id);
      }

      router.replace(`/(tabs)/(ownerOffers)?refresh=${Date.now()}`);

      setTitle("");
      setDescription("");
      setValidFrom(new Date());
      setValidUntil(new Date());

    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <OwnerOfferHeader />

      <ScrollView
        contentContainerStyle={styles.container}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {/* 📦 Basic Info */}
        <OfferStepContainer title="Offer Details">
          <TextInput
            style={styles.underlineInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Domestic Beer Special"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={[styles.underlineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: $2 off all domestic beers on tap!"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </OfferStepContainer>

        {/* 📅 Validity */}
        <OfferStepContainer title="Offer Dates">
          <View style={styles.dateRow}>
            {/* Start Date */}
            <Pressable style={styles.dateInputWrapper} onPress={() => setPickerType("from")}>
              <TextInput
                style={styles.underlineInput}
                editable={false}
                placeholder="Start Date"
                placeholderTextColor="#9CA3AF"
                value={validFrom ? format(validFrom, "MMM d, yyyy h:mm a") : ""}
              />
              <Text style={styles.icon}>📅</Text>
            </Pressable>

            {/* End Date */}
            <Pressable style={styles.dateInputWrapper} onPress={() => setPickerType("until")}>
              <TextInput
                style={styles.underlineInput}
                editable={false}
                placeholder="End Date"
                placeholderTextColor="#9CA3AF"
                value={validUntil ? format(validUntil, "MMM d, yyyy h:mm a") : ""}
              />
              <Text style={styles.icon}>📅</Text>
            </Pressable>
          </View>

          <DatePicker
            modal
            open={pickerType !== null}
            date={tempDate}
            mode="datetime"
            onConfirm={() => {
              if (pickerType === "from") setValidFrom(tempDate);
              if (pickerType === "until") setValidUntil(tempDate);
              setPickerType(null);
            }}
            onCancel={() => setPickerType(null)}
            onDateChange={setTempDate}
            theme="dark"
          />
        </OfferStepContainer>

        {/* 🎯 Audience */}
        <TargetAudienceSection
          selectedChips={selectedChips}
          setSelectedChips={setSelectedChips}
          spend={spend}
          setSpend={setSpend}
          distance={distance}
          setDistance={setDistance}
        />

        <OfferStepContainer title="Send Now or Schedule">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#fff", fontSize: 16 }}>Send Now</Text>
            <Switch
              value={sendNow}
              onValueChange={(val) => {
                if (!val) {
                  Alert.alert("Scheduled offers coming soon!");
                } else {
                  setSendNow(true); // Keep it on if toggled back to true
                }
              }}
              trackColor={{ false: "#6B7280", true: "#A78BFA" }}
              thumbColor={sendNow ? "#7C3AED" : "#D1D5DB"}
            />
          </View>
        </OfferStepContainer>


        {/* 📝 Submit Button */}
        <Pressable
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !title || !description || !validFrom || !validUntil}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Offer</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1F2937", // Tailwind neutral-800
    color: "#ffffff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  inputText: {
    color: "#ffffff",
    fontSize: 14,
  },
  textArea: {
    height: 100,
  },
  // underlineInput: {
  //   borderBottomWidth: 1,
  //   borderColor: "#9CA3AF", // light gray
  //   paddingVertical: 8,
  //   fontSize: 16,
  //   color: "#fff",
  //   marginBottom: 24,
  //   backgroundColor: "transparent",
  // },
  submitButton: {
    backgroundColor: "#7C3AED", // Tailwind purple-600
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
    position: "relative",
  },
  underlineInput: {
    borderBottomWidth: 1,
    borderColor: "#9CA3AF",
    paddingVertical: 8,
    fontSize: 16,
    color: "#fff",
    paddingRight: 28, // to make space for icon
  },
  icon: {
    position: "absolute",
    right: 4,
    bottom: 12,
    fontSize: 16,
    color: "#9CA3AF",
  },
});

export default CreateOfferScreen;
