// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.https://vdayzomsqzlpjtdifnzc.supabase.co;
const supabaseAnonKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYXl6b21zcXpscGp0ZGlmbnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0Mzc3MjEsImV4cCI6MjA3MjAxMzcyMX0.GsyZuosOCkStOVBpHC_2-6CgM-W27LjCTAPpBUTtuS4;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
