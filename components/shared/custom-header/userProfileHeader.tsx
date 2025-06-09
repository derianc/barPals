import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { Box } from "@/components/ui/box";
import { ImageBackground } from "@/components/ui/image-background";

const UserProfileHeader = ({
}: {
    }) => {
    return (
        <Box style={styles.headerContainer}>
            <ImageBackground
                source={require("@/assets/images/barpals-header.jpg")}
                style={styles.image}
            >
                <Box style={styles.overlay} pointerEvents="none" />
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
    image: {
        height: 160, // Add a fixed height
        width: "100%", // Optional but useful
        justifyContent: "center",
    },
});


export default UserProfileHeader;
