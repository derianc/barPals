import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    TextInput,
    FlatList,
    Text,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import UserCard from "@/components/screens/adminUser/userCard";
import { fetchAdminUsers, updateUser } from "@/services/sbAdminUserService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GenericHeader from "@/components/shared/custom-header/genericHeader";

const PAGE_SIZE = 20;

export default function AdminUsersScreen() {
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "user" | "owner" | "admin">("all");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadUsers = useCallback(
        async (pageNum = 1, isRefresh = false) => {
            if (!isRefresh && !hasMore && pageNum !== 1) return;

            const result = await fetchAdminUsers({
                search,
                role: roleFilter,
                page: pageNum,
                pageSize: PAGE_SIZE,
            });

            if (isRefresh) {
                setUsers(result);
            } else {
                setUsers((prev) => [...prev, ...result]);
            }

            setHasMore(result.length === PAGE_SIZE);
            setLoading(false);
            setPage(pageNum);
        },
        [search, roleFilter] // ✅ removed hasMore
    );

    useEffect(() => {
        console.log("🔄 triggering initial load...");
        setLoading(true);
        loadUsers(1, true);
    }, [loadUsers]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadUsers(1, true);
        setRefreshing(false);
    };

    const handleEndReached = () => {
        if (!loading && hasMore) {
            loadUsers(page + 1);
        }
    };

    const handleRoleChange = (id: string, newRole: "user" | "owner" | "admin") =>
        updateUser(id, { role: newRole }).then(handleRefresh);

    const handleStatusToggle = (id: string, isActive: boolean) =>
        updateUser(id, { is_active: isActive }).then(handleRefresh);

    const handleDisplayNameSave = (id: string, newName: string) =>
        updateUser(id, { full_name: newName }).then(handleRefresh);

    return (
        <View style={styles.container}>
            <GenericHeader />

            <View style={[styles.header, { paddingBottom: insets.bottom + 30}]}>
                <TextInput
                    placeholder="Search by email..."
                    placeholderTextColor="#999"
                    value={search}
                    onChangeText={(t) => setSearch(t)}
                    style={styles.searchInput}
                />
                <View style={styles.filterRow}>
                    {["all", "user", "owner", "admin"].map((role) => (
                        <Text
                            key={role}
                            style={[
                                styles.filterItem,
                                roleFilter === role && styles.filterItemSelected,
                            ]}
                            onPress={() => setRoleFilter(role as any)}
                        >
                            {role.toUpperCase()}
                        </Text>
                    ))}
                </View>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <UserCard
                        user={item}
                        onRoleChange={handleRoleChange}
                        onStatusToggle={handleStatusToggle}
                        onDisplayNameSave={handleDisplayNameSave}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.2}
                ListFooterComponent={
                    loading && page > 1 ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null
                }
            />
        </View>
    );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // ✅ solid black
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchInput: {
    height: 40,
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#333",
    color: "#FFF",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    borderRadius: 8,
    color: "#FFF",
    backgroundColor: "#222",
  },
  filterItemSelected: {
    backgroundColor: "#3B82F6",
    color: "white",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});

