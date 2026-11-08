// ============================================================================
//  Client Supabase (base PostgreSQL hébergée)
//  La clé "publishable" est PUBLIQUE par conception (prévue pour le navigateur).
//  On peut la surcharger via des variables d'environnement Vite si besoin.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://sgribuenrrgpquydkkdw.supabase.co';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY ||
  'sb_publishable_fdAvblCCH-APObaJ2ULyrg_GjzfVFyy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

export default supabase;
