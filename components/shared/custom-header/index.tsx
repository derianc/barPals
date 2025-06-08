// import React, { useContext } from "react";
// import { HStack } from "@/components/ui/hstack";
// import { SearchIcon } from "@/components/ui/icon";
// import { VStack } from "@/components/ui/vstack";
// import { Text } from "@/components/ui/text";
// import { Box } from "@/components/ui/box";
// import { ImageBackground } from "@/components/ui/image-background";
// import { Image } from "@/components/ui/image";
// import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
// import { Mic } from "lucide-react-native";
// import { ThemeContext } from "@/contexts/theme-context";

// const CustomHeader = ({
//   variant = "general",
//   title,
//   label,
//   receiptCount,
//   totalSpend,
// }: {
//   variant: "general" | "search";
//   title?: string;
//   label?: string;
//   receiptCount?: number;
//   totalSpend?: number;
// }) => {
//   const { colorMode }: any = useContext(ThemeContext);
//   return (
//     <Box className="bg-background-0 rounded-b-3xl overflow-hidden mb-3">
//       <ImageBackground
//         source={
//           colorMode === "dark"
//             ? require("@/assets/images/barpals-header.jpg")
//             : require("@/assets/images/weather-bg-light.webp")
//         }
//       >
//         <Box
//           className="absolute top-0 left-0 right-0 bottom-0 bg-black/20 z-0"
//           pointerEvents="none"
//         />
//         <HStack className="p-5 pt-16 gap-6 justify-between">
//           <HStack className="justify-between">
//             <VStack className="gap-2.5 justify-between">
//               <Text className="text-background-700 font-dm-sans-bold text-3xl">
//                 {receiptCount} {title}
//               </Text>
//             </VStack>
//           </HStack>
//           <HStack className="gap-4">
//             <VStack className="justify-end items-center">
//               <Text className="text-typography-800 font-dm-sans-regular text-4xl mt-2">
//                 ${totalSpend?.toFixed(2) || "0.00"}
//               </Text>
//               <Text className="text-typography-800 font-dm-sans-medium text-xs">
//                 Feels like 12°
//               </Text>
//             </VStack>
//           </HStack>
//         </HStack>
//         {variant === "search" && (
//           <Input
//             variant="outline"
//             className="border-0 bg-background-50 rounded-xl py-1 px-4 mt-2 mb-5 mx-5"
//             size="lg"
//           >
//             <InputSlot>
//               <InputIcon as={SearchIcon} className="text-outline-200" />
//             </InputSlot>
//             <InputField
//               placeholder={label}
//               className="placeholder:text-typography-200"
//             />
//             <InputSlot>
//               <InputIcon as={Mic} className="text-outline-200" />
//             </InputSlot>
//           </Input>
//         )}
//       </ImageBackground>
//     </Box>
//   );
// };

// export default CustomHeader;

import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { SearchIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { ImageBackground } from "@/components/ui/image-background";
import { Image } from "@/components/ui/image";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Mic } from "lucide-react-native";
import { ThemeContext } from "@/contexts/theme-context";

const CustomHeader = ({
  variant = "general",
  title,
  label,
  receiptCount,
  mostVisited,
  searchQuery,
  onSearchChange,
}: {
  variant: "general" | "search";
  title?: string;
  label?: string;
  receiptCount?: number;
  mostVisited: string
  searchQuery: string;
  onSearchChange: (text: string) => void;
}) => {
  const { colorMode }: any = useContext(ThemeContext);

  return (
    <Box style={styles.headerContainer}>
      <ImageBackground
        source={
          colorMode === "dark"
            ? require("@/assets/images/barpals-header.jpg")
            : require("@/assets/images/weather-bg-light.webp")
        }
      >
        <Box style={styles.overlay} pointerEvents="none" />

        <HStack style={styles.headerContent}>
          <Text style={styles.receiptCountValue}>
            {receiptCount}
            <Text style={styles.receiptCountLabel}> Receipts</Text>
          </Text>

          <HStack style={styles.metricsContainer}>
            <VStack style={styles.mostVisitedBlock}>
              <Text style={styles.mostVisitedLabel}>
                Most Visited:
              </Text>
              <Text style={styles.mostVisitedValue}>
                {mostVisited || "N/A"}
              </Text>
            </VStack>
          </HStack>
        </HStack>

        {variant === "search" && (
          <Input
            variant="outline"
            size="lg"
            style={styles.searchInput}
          >
            <InputSlot>
              <InputIcon as={SearchIcon} style={styles.searchIcon} />
            </InputSlot>
            <InputField
              placeholder={label}
              style={styles.placeholderText}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </Input>
        )}
      </ImageBackground>
    </Box>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    marginBottom: 12,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 0,
  },
  headerContent: {
    paddingTop: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
  },
  titleContainer: {
    gap: 10,
    justifyContent: "center",
  },
  receiptCountLabel: {
  fontSize: 20,
  fontFamily: "dm-sans-regular", // not bold
  color: "#ffffff",
},
receiptCountValue: {
  fontSize: 20,
  fontFamily: "dm-sans-bold",
  color: "#ffffff",
},
  metricsContainer: {
    gap: 16,
  },
  mostVisitedBlock: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  mostVisitedValue: {
    fontSize: 18,
    fontFamily: "dm-sans-regular",
    color: "#ffffff", // white text
    marginTop: 8,
  },
  mostVisitedLabel: {
    fontSize: 12,
    fontFamily: "dm-sans-medium",
    color: "#ffffff", // white text
  },
  searchInput: {
    borderWidth: 0,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 30,
    marginBottom: 15,
    marginHorizontal: 40,
  },
  searchIcon: {
    color: "#D1D5DB",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
});


export default CustomHeader;
