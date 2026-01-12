import { createClient } from '@supabase/supabase-js';

// ⚠️ REMPLACE CES VALEURS par celles de ton tableau de bord Supabase
// (Paramètres du projet -> API)
const SUPABASE_URL = 'https://olusnnrjseqjuxxrgqff.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XKKFZ8DsfIeybfIsHKoa0w_trz4hWPF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);