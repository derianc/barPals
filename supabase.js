import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; 

const SUPABASE_URL = 'https://pgswimjajpjupnafjosl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3dpbWphanBqdXBuYWZqb3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzgyNjksImV4cCI6MjA2NDU1NDI2OX0.FXNmb_tmymwSzqN5b3wEFK3jfZZ6B7dAvcVPcrGQops';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
  },
});
