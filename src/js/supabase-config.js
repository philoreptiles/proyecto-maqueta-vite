import { createClient } from '@supabase/supabase-js';

// 🔑 Credenciales de Supabase
const SUPABASE_URL = 'https://wgrwabzusigtwqffugnq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncndhYnp1c2lndHdxZmZ1Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NzE3MDQsImV4cCI6MjEwNDA0NzcwNH0.GZnhw8jcaEKojrWiaG16eamG09H-dAoTauKTTHgnLLw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);