// Importación directa por CDN compatible con módulos de navegador
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 🔑 Credenciales de Supabase
const SUPABASE_URL = 'https://wgrwabzusigtwqffugnq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncndhYnp1c2lndHdxZmZ1Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NzE3MDQsImV4cCI6MjEwNDA0NzcwNH0.GZnhw8jcaEKojrWiaG16eamG09H-dAoTauKTTHgnLLw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuración de Caché
export const CACHE_CONFIG = {
  cacheControl: 'public, max-age=86400, immutable',
  upsert: false
};