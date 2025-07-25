import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import GenericHeader from "@/components/shared/custom-header/genericHeader";
import { searchOwnersByEmail } from "@/services/sbUserService";
import { saveVenueChanges } from "@/services/sbAdminVenueService";

export default function EditVenueScreen({
  id,
  name,
  address,
  city,
  state,
  owner_email
}: {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  owner_email?: string;
}) {
  const router = useRouter();

  const [venueName, setVenueName] = useState(name as string);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<{ id: string; email: string }[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<{ id: string; email: string } | null>(
    owner_email ? { id: "", email: owner_email as string } : null
  );

  const handleSearch = async (text: string) => {
    setOwnerSearch(text);
    if (text.length < 2) {
      setOwnerResults([]);
      return;
    }
    const results = await searchOwnersByEmail(text);
    setOwnerResults(results);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0e0e10" }}>
    <GenericHeader />
    
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Edit Venue</Text>

      <Text style={styles.label}>Venue Name</Text>
      <TextInput
        value={venueName}
        onChangeText={setVenueName}
        placeholder="Venue name"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
      />

      <Text style={styles.label}>Assign Owner</Text>
      <TextInput
        value={ownerSearch}
        onChangeText={handleSearch}
        placeholder="Search by email"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
      />

      {ownerResults.length > 0 && (
        <FlatList
          data={ownerResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedOwner(item);
                setOwnerSearch(item.email);
                setOwnerResults([]);
              }}
              style={styles.ownerOption}
            >
              <Text style={styles.ownerText}>{item.email}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled"
          style={styles.ownerList}
        />
      )}

      {selectedOwner && (
        <Text style={styles.selectedText}>
          Assigned to: {selectedOwner.email}
        </Text>
      )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={async () => {
            const result = await saveVenueChanges(id, {
              name: venueName,
              ownerId: selectedOwner?.id || null,
            });

            if (result.success) {
              router.back();
            } else {
              alert("❌ Failed to save changes. Please try again.");
            }
          }}
        >
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e10",
    padding: 20,
  },
  title: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 24,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 20,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#1F2937",
    color: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#374151",
  },
  ownerList: {
    marginTop: 6,
    backgroundColor: "#111827",
    borderRadius: 12,
    overflow: "hidden",
  },
  ownerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomColor: "#374151",
    borderBottomWidth: 1,
  },
  ownerText: {
    color: "#E5E7EB",
    fontSize: 14,
  },
  selectedText: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 10,
    fontStyle: "italic",
  },
  saveButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.4,
  },
});

