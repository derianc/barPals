import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Button } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useUser } from '@/contexts/userContext';
import { useRouter } from 'expo-router';
import { getVenueForUser, getVenueDetails } from "@/services/sbVenueService";

import {
  subscribeToLocationInserts,
  unsubscribeFromLocationUpdates,
  getNearbyUserLocations,
  simulateUserMovementNearVenue,
  deleteTestLocations
} from "@/services/sbLocationService";

const RADIUS_METERS = 2000;

const OwnerMapScreen = () => {
  const { user, rehydrated } = useUser();
  const [venue, setVenue] = useState<any>(null);
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchVenueAndLocations = async () => {
    console.log("🔄 fetchVenueAndLocations called");
    setLoading(true);

    if (!user) {
      console.warn("⚠️ No user found in context");
      setLoading(false);
      return;
    }

    try {
      const venueId = await getVenueForUser(user.id);
      console.log(`🏢 Found venue_id: ${venueId}`);

      const venueData = await getVenueDetails(venueId);
      console.log("📍 Venue loaded:", venueData);
      setVenue(venueData);

      const locations = await getNearbyUserLocations(venueData.latitude, venueData.longitude, RADIUS_METERS, 5);
      console.log(`🧭 Found ${locations.length} nearby user locations`);
      setUserLocations(locations);

    } catch (err) {
      console.error("❌ Failed during fetchVenueAndLocations:", err);
    }

    setLoading(false);
  };

  const refreshNearbyUsers = async () => {
    if (!venue) return;
    const data = await getNearbyUserLocations(venue.latitude, venue.longitude, RADIUS_METERS);
    setUserLocations(data);
  };

  const subscribeToLocationUpdates = () => {
    console.log("📡 Subscribing to location updates...");
    return subscribeToLocationInserts(async (loc) => {
      console.log("📬 New activity detected, refreshing...");
      await refreshNearbyUsers();
    });
  };

  useEffect(() => {
    if (!user) {
      console.log('🚫 useEffect: No user yet – skipping setup');
      return;
    }

    let subscription: any;

    const run = async () => {
      console.log('▶️ useEffect: running setup');
      await fetchVenueAndLocations();
      subscription = subscribeToLocationUpdates();
    };

    run();

    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up Supabase channel subscription');
        unsubscribeFromLocationUpdates(subscription);
      }
    };
  }, [user]);

  useEffect(() => {
    if (rehydrated && !user) {
      console.warn('🔐 No session found — redirecting to login');
      router.replace('/login'); // or whatever your login route is
    }
  }, [rehydrated, user]);

  if (!rehydrated || loading || !venue) {
    console.log(`⏳ Loading state: loading=${loading}, venue=${!!venue}`);
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log('✅ Map ready to render');

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: venue.latitude,
          longitude: venue.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
          title={venue.name}
          pinColor="blue"
        />
        <Circle
          center={{ latitude: venue.latitude, longitude: venue.longitude }}
          radius={RADIUS_METERS}
          fillColor="rgba(0,150,255,0.2)"
          strokeColor="rgba(0,150,255,0.5)"
        />
        {userLocations.map((loc, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: parseFloat(loc.latitude), longitude: parseFloat(loc.longitude) }}
            title={`User ${loc.user_id}`}
            pinColor="green"
          />
        ))}
      </MapView>

      {__DEV__ && (
        <View style={{ position: 'absolute', bottom: 40, left: 20, gap: 10 }}>
          {venue && (
            <Button
              title="Create Nearby"
              onPress={() => simulateUserMovementNearVenue(venue, 15)}
            />
          )}
          <Button
            title="🧹 Delete Nearby"
            onPress={deleteTestLocations}
          />
        </View>
      )}
    </View>
  );
};

export default OwnerMapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});