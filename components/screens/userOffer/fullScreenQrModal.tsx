import React, { useEffect } from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Brightness from "expo-brightness";

const FullScreenQrModal = ({ visible, onClose, value }: { visible: boolean; onClose: () => void; value: string }) => {
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
      <TouchableOpacity style={styles.container} onPress={onClose}>
        <QRCode value={value} size={260} />
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
});

export default FullScreenQrModal;
