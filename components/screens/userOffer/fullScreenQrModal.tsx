import React, { useEffect } from "react";
import { Modal, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Brightness from "expo-brightness";
import { format, parseISO } from "date-fns";

const FullScreenQrModal = ({
  visible,
  onClose,
  value,
  offer,
}: {
  visible: boolean;
  onClose: () => void;
  value: string;
  offer: {
    title: string;
    description: string;
    venue_name: string;
    valid_until: string;
  };
}) => {
  useEffect(() => {
    if (visible) {
      Brightness.setSystemBrightnessAsync(1.0);
    }
    return () => {
      Brightness.useSystemBrightnessAsync();
    };
  }, [visible]);0

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <TouchableOpacity style={styles.container} onPress={onClose} activeOpacity={1}>
        <QRCode value={value} size={240} />

        <View style={styles.offerDetails}>
          <Text style={styles.title}>{offer?.title}</Text>
          <Text style={styles.venue}>From {offer?.venue_name}</Text>
          <Text style={styles.description}>{offer?.description}</Text>
          <Text style={styles.expiry}>
            Expires {format(parseISO(offer?.valid_until), "MMM d, yyyy")} @
            {format(parseISO(offer?.valid_until), "h:mm a")}
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  offerDetails: {
    marginTop: 24,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  venue: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 10,
    textAlign: "center",
  },
  expiry: {
    fontSize: 13,
    color: "#6B7280",
  },
});

export default FullScreenQrModal;
