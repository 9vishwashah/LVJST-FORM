import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {

  // Allow only POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OK" })
    };
  }

  // Safely parse body
  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" })
    };
  }

  const { pageKey, isUnique } = body;

  if (!pageKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing pageKey" })
    };
  }

  try {
    // Increment total visits
    await supabase.rpc("increment_total_visits", {
      p_page_key: pageKey
    });

    // Increment unique visits if applicable
    if (isUnique) {
      await supabase.rpc("increment_unique_visits", {
        p_page_key: pageKey
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
