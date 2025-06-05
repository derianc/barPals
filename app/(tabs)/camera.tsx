import { View, Text } from "react-native";
import CameraView from "@/components/screens/camera";

export default function CameraScreen() {
  const handleCapture = (uri: string) => {
    
  };

  return <CameraView onCapture={handleCapture} />;
}
