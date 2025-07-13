import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Button } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useUser } from '@/contexts/userContext';
import { useRouter } from 'expo-router';
import { useVenue } from '@/contexts/venueContex';

import {
  subscribeToLocationInserts,
  unsubscribeFromLocationUpdates,
  getNearbyUserLocations,
} from "@/services/sbLocationService";
import { deleteTestLocations, simulateUserMovementNearVenue } from '@/services/sbEdgeFunctions';

const RADIUS_METERS = 2000;

const OwnerMapScreen = () => {
  const { user, rehydrated } = useUser();
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { selectedVenue } = useVenue();
  const mapRef = useRef<MapView>(null);

  const fetchVenueAndLocations = async () => {
    console.log("🔄 fetchVenueAndLocations called");
    setLoading(true);

    if (!user) {
      console.warn("⚠️ No user found in context");
      setLoading(false);
      return;
    }

    try {
      if (!selectedVenue) {
        console.warn("🚫 No selectedVenue available from context");
        setLoading(false);
        return;
      }

      console.log("📍 Venue loaded from context:", selectedVenue);
      console.log(`🧭 Fetching nearby user locations within ${RADIUS_METERS} meters of venue at (${selectedVenue.latitude}, ${selectedVenue.longitude})`);
      const locations = await getNearbyUserLocations(selectedVenue.latitude, selectedVenue.longitude, RADIUS_METERS, 5);
      console.log(`🧭 Found ${locations.length} nearby user locations`);
      setUserLocations(locations);

    } catch (err) {
      console.error("❌ Failed during fetchVenueAndLocations:", err);
    }

    setLoading(false);
  };

  const refreshNearbyUsers = async () => {
    if (!selectedVenue) return;
    const data = await getNearbyUserLocations(selectedVenue.latitude, selectedVenue.longitude, RADIUS_METERS);
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

  useEffect(() => {
    if (selectedVenue && mapRef.current) {
      const region = {
        latitude: selectedVenue.latitude,
        longitude: selectedVenue.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      console.log("📍 Venue changed, updating map region and user locations");
      mapRef.current.animateToRegion(region, 1000);
      fetchVenueAndLocations();
    }
  }, [selectedVenue]);

  if (!rehydrated || loading || !selectedVenue) {
    console.log(`⏳ Loading state: loading=${loading}, venue=${!!selectedVenue}`);
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
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: selectedVenue.latitude,
          longitude: selectedVenue.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{ latitude: selectedVenue.latitude, longitude: selectedVenue.longitude }}
          title={selectedVenue.name}
          pinColor="blue"
        />
        <Circle
          center={{ latitude: selectedVenue.latitude, longitude: selectedVenue.longitude }}
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
          {selectedVenue && (
            <Button
              title="Create Nearby"
              onPress={() => simulateUserMovementNearVenue(selectedVenue, 15)}
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