const supabaseUrl = 'https://bcfatzpxpqecvcwjgzhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZmF0enB4cHFlY3Zjd2pnemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODE4NjAsImV4cCI6MjA4ODU1Nzg2MH0.5zp_onUcpCXpIvFuMHELEIk8Yb7KoRxrwhj1c-ya5Og';

async function fetchHackathons() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/hackathons?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const data = await res.json();
    console.log("Total hackathons loaded:", data.length);
    for (const h of data) {
      console.log(`ID: ${h.id}, Name: ${h.name}`);
      console.log(`  Reg End: ${h.registration_end_date}, Start: ${h.start_date}`);
      console.log(`  Submit End: ${h.submission_end_date}, End: ${h.end_date}`);
    }
  } catch (err) {
    console.error('Error fetching:', err);
  }
}

fetchHackathons();
