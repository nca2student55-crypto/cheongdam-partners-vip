// Supabase 클라이언트 초기화

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rbunpzizpkvouhdhxlih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidW5weml6cGt2b3VoZGh4bGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTQ3NTYsImV4cCI6MjA4Mjc3MDc1Nn0.1UjCChZUJumRlVgLgcFmHT6QvmdLaMsR4PNtkartNDA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
