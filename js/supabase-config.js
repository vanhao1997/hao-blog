// Initialize Supabase Client
const SUPABASE_URL = 'https://jdfutmhzxqxgqxdvkzfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZnV0bWh6eHF4Z3F4ZHZremZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjEwNzUsImV4cCI6MjA4NDMzNzA3NX0.4aAYUb0AKOxf5prbjR-7730uPtSt-ez5jif7ABbcQds';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for other scripts
window.supabaseClient = supabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
