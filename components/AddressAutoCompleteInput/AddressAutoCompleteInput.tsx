import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { getAddressSuggestions } from "@/services/geocodingService";

export default function AddressAutocompleteInput({
  onSelect,
}: {
  onSelect: (item: {
    formatted: string;
    lat: number;
    lng: number;
    components: any;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    const res = await getAddressSuggestions(text);
    setResults(res);
  };

    const handleSelect = (item: any) => {
        const formattedWithoutLastPart = item.formatted.replace(/,?[^,]*$/, "");

        onSelect({
            formatted: formattedWithoutLastPart,
            lat: item.geometry.lat,
            lng: item.geometry.lng,
            components: item.components,
        });

        setQuery(formattedWithoutLastPart);
        setResults([]);
    };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={handleSearch}
        placeholder="Enter address"
        placeholderTextColor="#64748B"
        style={styles.input}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.formatted}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item)} style={styles.suggestion}>
            <Text style={{ color: "#F8FAFC" }}>{item.formatted}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  suggestion: {
    paddingVertical: 8,
    borderBottomColor: "#334155",
    borderBottomWidth: 1,
  },
});
