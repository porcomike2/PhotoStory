import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type Photo = {
  id: string;
  user_id: string;
  storage_url: string;
  title: string;
  photo_date: string;
  location: string | null;
  story: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  created_at: string;
};

export type Story = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type PhotoStory = {
  id: string;
  story_id: string;
  photo_id: string;
  position: number;
  created_at: string;
};
