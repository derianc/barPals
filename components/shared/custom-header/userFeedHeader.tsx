import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { SearchIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { ImageBackground } from "@/components/ui/image-background";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";

const UserFeedHeader = ({
  label,
  receiptCount,
  mostVisited,
  searchQuery,
  onSearchChange,
}: {
  title?: string;
  label?: string;
  receiptCount?: number;
  mostVisited: string
  searchQuery: string;
  onSearchChange: (text: string) => void;
}) => {
  return (
    <Box style={styles.headerContainer}>
      <ImageBackground
        source={require("@/assets/images/barpals-header.jpg")}
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


export default UserFeedHeader;
