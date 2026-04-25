import { localBackend } from './localBackend';
import { supabaseBackend } from './supabaseBackend';

const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';

export const backend = useSupabase ? supabaseBackend : localBackend;
