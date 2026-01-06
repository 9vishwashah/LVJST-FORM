import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  const { pageKey, isUnique } = JSON.parse(event.body);

  const updates = {
    total_visits: supabase.rpc('increment'),
    last_visited_at: new Date()
  };

  if (isUnique) {
    updates.unique_visits = supabase.rpc('increment');
  }

  const { error } = await supabase
    .from('form_visits')
    .update(updates)
    .eq('page_key', pageKey);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}
