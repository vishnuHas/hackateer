/**
 * AETHER Supabase Database Connection Client
 * Instantiates the global supabaseClient instance.
 */

const supabaseUrl = 'https://bcfatzpxpqecvcwjgzhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZmF0enB4cHFlY3Zjd2pnemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODE4NjAsImV4cCI6MjA4ODU1Nzg2MH0.5zp_onUcpCXpIvFuMHELEIk8Yb7KoRxrwhj1c-ya5Og';

if (typeof supabase === 'undefined') {
  console.error('Supabase library not loaded. Make sure the Supabase CDN script tag is placed before this file.');
}

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
