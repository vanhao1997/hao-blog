// Demo data for local testing without API
// This file provides mock post data when the Supabase API is unavailable

const DEMO_POSTS = [];

const DEMO_CATEGORIES = [];

// Export for use in other files
if (typeof window !== 'undefined') {
    window.DEMO_POSTS = DEMO_POSTS;
    window.DEMO_CATEGORIES = DEMO_CATEGORIES;
}
