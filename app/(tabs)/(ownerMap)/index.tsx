import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useUser } from '@/contexts/userContext';
import { supabase } from '@/supabase';
import { useRouter } from 'expo-router';

const RADIUS_METERS = 50000;

const OwnerMapScreen = () => {
  const { user, rehydrated } = useUser();
  const [venue, setVenue] = useState<any>(null);
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isWithinRadius = (lat: number, lng: number) => {
    if (!venue) return false;
    const dist = haversine(venue.latitude, venue.longitude, lat, lng);
    return dist <= RADIUS_METERS;
  };

  const fetchVenueAndLocations = async () => {
    console.log('🔄 fetchVenueAndLocations called');
    setLoading(true);

    if (!user) {
      console.warn('⚠️ No user found in context');
      setLoading(false);
      return;
    }

    console.log(`👤 Current user ID: ${user.id}`);

    // Step 1: Get venue_id from venue_users
    const { data: venueLink, error: linkError } = await supabase
      .from('venue_users')
      .select('venue_id')
      .eq('profile_id', user.id)
      .single();

    if (linkError || !venueLink) {
      console.error('❌ Venue lookup failed:', linkError);
      setLoading(false);
      return;
    }

    console.log(`🏢 Found venue_id: ${venueLink.venue_id}`);

    // Step 2: Load venue details
    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueLink.venue_id)
      .single();

    if (venueError || !venueData) {
      console.error('❌ Venue fetch failed:', venueError);
      setLoading(false);
      return;
    }

    console.log('📍 Venue loaded:', venueData);
    setVenue(venueData);

    // Step 3: Load user locations
    const { data: locations, error: locationError } = await supabase
      .from('user_location')
      .select('id, user_id, latitude, longitude, recorded_at');

    if (locationError) {
      console.error('❌ Location fetch failed:', locationError);
    } else {
      const nearby = locations.filter(loc => isWithinRadius(loc.latitude, loc.longitude));
      console.log(`🧭 Found ${nearby.length} nearby user locations`);
      setUserLocations(nearby);
    }

    setLoading(false);
  };

  const subscribeToLocationUpdates = () => {
    console.log('📡 Subscribing to location updates...');
    return supabase
      .channel('location-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_location' },
        payload => {
          const loc = payload.new;
          console.log('📬 Received location insert:', loc);
          if (isWithinRadius(loc.latitude, loc.longitude)) {
            console.log('✅ New location is within radius – adding to state');
            setUserLocations(prev => [...prev, loc]);
          } else {
            console.log('🚫 New location is outside radius – ignoring');
          }
        }
      )
      .subscribe();
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
        supabase.removeChannel(subscription);
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
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={`User ${loc.user_id}`}
            pinColor="green"
          />
        ))}
      </MapView>
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
