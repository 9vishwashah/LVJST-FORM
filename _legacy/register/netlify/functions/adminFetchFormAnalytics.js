import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler() {
  const { data, error } = await supabase
    .from('form_visits')
    .select('total_visits')
    .eq('page_key', 'lvjst_member_registration')
    .single();

  if (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' }, // ✅ REQUIRED
    body: JSON.stringify({
      visits: Number(data.total_visits) // ✅ force number
    })
  };
}

