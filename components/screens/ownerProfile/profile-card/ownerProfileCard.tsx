import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text as AppText } from "@/components/ui/text";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Bell, LogOut, MapPin, Store } from "lucide-react-native";
import { logout, updateUserProfile } from "@/services/sbUserService";
import { useRouter } from "expo-router";
import ModalDropdown from 'react-native-modal-dropdown';
import { Text } from "react-native";
import { useVenue } from "@/contexts/venueContex";
import { Venue } from "@/types/Venue";

interface ProfileCardProps {
    userId: string;
    full_name: string;
    username?: string;
    created_at: string;
    allow_notifications: boolean;
    venues: Venue[];
    onToggleNotifications?: (val: boolean) => void;
    onEditName?: (val: string) => void;
}

const OwnerProfileCard = ({
    userId,
    allow_notifications,
    onToggleNotifications,
    venues,
}: ProfileCardProps) => {
    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
    const scale = useSharedValue(1);
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(allow_notifications);
    const { selectedVenue, setSelectedVenue, allVenues, setAllVenues } = useVenue();

    useEffect(() => {
        if (venues.length > 0) {
            setAllVenues(venues);
            if (!selectedVenue) {
                setSelectedVenue(venues[0]);
            }
        }
    }, [venues]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSequence(withSpring(0.95), withSpring(1));
    };

    const handleToggle = async () => {
        const newValue = !notificationsEnabled;

        const { error } = await updateUserProfile(userId, {
            allow_notifications: newValue,
        });

        if (error) {
            console.error("Failed to update notifications:", error.message);
            return;
        }

        setNotificationsEnabled(newValue);
        onToggleNotifications?.(newValue);
    };

    const handleLogout = async () => {
        const { error } = await logout();

        if (error) {
            //console("Logout Error", error.message);
            return;
        }

        // ✅ Navigate to login or splash screen
        router.replace("/login");
    };

    return (
        <>
            <AnimatedPressable
                style={[animatedStyle, styles.card]}
                onPress={handlePress}
            >
                <HStack style={styles.notificationRow}>
                    <HStack className="items-center">
                        <View style={styles.notificationIcon}>
                            <Icon as={Bell} size="sm" color="#fff" />
                        </View>
                        <VStack style={{ marginLeft: 12 }}>
                            <AppText style={styles.notificationTitle}>Notifications</AppText>
                            <AppText style={styles.notificationSub}>
                                {allow_notifications ? "ENABLED" : "DISABLED"}
                            </AppText>
                        </VStack>
                    </HStack>

                    <Switch
                        value={notificationsEnabled}
                        onValueChange={handleToggle}
                        trackColor={{ false: "#374151", true: "#6A11CB" }}
                        thumbColor={notificationsEnabled ? "#fff" : "#f4f4f5"}
                    />
                </HStack>
            </AnimatedPressable>
            
            <View style={styles.venueDropdownContainer}>
                <AppText style={styles.dropdownLabel}>Your Venues</AppText>

                <ModalDropdown
                    options={allVenues.map((v) => v.name)}
                    defaultValue={
                        selectedVenue?.name && allVenues.find(v => v.name === selectedVenue.name)
                            ? selectedVenue.name
                            : allVenues[0]?.name ?? "Select a venue"
                    }
                    style={styles.dropdown}
                    textStyle={styles.dropdownText}
                    dropdownStyle={styles.dropdownList}
                    onSelect={(index) => {
                        const i = typeof index === "string" ? parseInt(index, 10) : index;
                        const venue = allVenues[i];
                        if (venue) {
                            setSelectedVenue(venue);
                            console.log("🏪 Venue changed to:", venue.name);
                        }
                    }}
                    renderRow={(option, index, isSelected) => (
                        <HStack
                            style={[
                                styles.dropdownRow,
                                { backgroundColor: isSelected ? "#6A11CB" : "transparent" },
                            ]}
                        >
                            <Icon as={MapPin} size="sm" color={isSelected ? "#fff" : "#ccc"} />
                            <Text style={{ color: isSelected ? "#fff" : "#ccc", marginLeft: 8 }}>
                                {option}
                            </Text>
                        </HStack>
                    )}
                />
            </View>
            
            <View style={styles.logoutCard}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <HStack style={{ alignItems: "center" }}>
                        <View style={styles.logoutIcon}>
                            <Icon as={LogOut} size="sm" color="#fff" />
                        </View>
                        <AppText style={styles.logoutText}>Log Out</AppText>
                    </HStack>
                </TouchableOpacity>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    input: {
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: "#111827",
    },
    notificationRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 12,
        marginTop: 12,
    },
    notificationIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#6A11CB",
        alignItems: "center",
        justifyContent: "center",
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    notificationSub: {
        fontSize: 12,
        color: "#D1D5DB",
        marginTop: 2,
    },
    card: {
        backgroundColor: "#1F2937",
        borderRadius: 18,
        paddingVertical: 4,
        paddingHorizontal: 20,
        gap: 16,
        marginHorizontal: 16, // adds spacing from screen edge
    },
    logoutCard: {
        backgroundColor: "#1F2937",
        borderRadius: 18,
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoutIcon: {
        backgroundColor: "#EF4444",
        padding: 8,
        borderRadius: 18,
        marginRight: 12,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#EF4444",
    },
    venueDropdownContainer: {
        marginTop: 12,
        backgroundColor: "#1F2937",
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
    },

    dropdownLabel: {
        color: "#D1D5DB",
        fontSize: 14,
        marginBottom: 4,
    },

    dropdown: {
        backgroundColor: '#374151',
        padding: 12,
        borderRadius: 8,
    },

    dropdownText: {
        fontSize: 16,
        color: '#fff',
    },

    dropdownList: {
        width: '80%',
        backgroundColor: '#1F2937',
        borderRadius: 8,
    },
    dropdownRow: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },
    registerCard: {
        backgroundColor: "#1E293B",   // same card background
        borderRadius: 16,
        marginHorizontal: 20,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconContainer: {
        backgroundColor: "#3B82F6",  // consistent blue accent
        padding: 8,
        borderRadius: 10,
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    label: {
        fontSize: 16,
        color: "#F8FAFC",
        fontWeight: "500",
    },

});

export default OwnerProfileCard;
