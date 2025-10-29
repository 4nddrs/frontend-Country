import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = import.meta.env.VITE_APP_SUPABASE_SERVICE_ROLE_KEY!;

// Main client used by the frontend. Explicitly enable session persistence and multi-tab sync.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		detectSessionInUrl: true,
		autoRefreshToken: true,
		storage: window.localStorage,
	},
});

// NOTE: supabaseAdmin uses the service role key and should NOT be exposed in a public client for production.
// This project currently uses supabaseAdmin in the frontend for convenience; move admin operations to a server
// or serverless function that uses the SERVICE_ROLE_KEY and call it from the client instead.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false,
	},
});