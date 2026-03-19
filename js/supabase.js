// Supabase Configuration
const SUPABASE_URL = 'https://jdfutmhzxqxgqxdvkzfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZnV0bWh6eHF4Z3F4ZHZremZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjEwNzUsImV4cCI6MjA4NDMzNzA3NX0.4aAYUb0AKOxf5prbjR-7730uPtSt-ez5jif7ABbcQds';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API Functions
const api = {
  // Posts
  async getPosts(options = {}) {
    let query = supabase
      .from('posts')
      .select(`
        *,
        category:categories(name, slug),
        author:authors(name, avatar_url)
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    
    if (options.category) {
      query = query.eq('category_id', options.category);
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  
  async getPost(slug) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        category:categories(name, slug),
        author:authors(name, avatar_url, bio)
      `)
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },
  
  // Images
  async getImages() {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Contact form
  async submitContact(formData) {
    // For now, just log the data
    // In production, you'd send this to an email service or save to DB
    console.log('Contact form submitted:', formData);
    return { success: true };
  }
};

// Export for use in other scripts
window.api = api;
window.supabaseClient = supabase;
