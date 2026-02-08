import { createClient } from '@supabase/supabase-js';

async function verifyRecaptcha(token, secret) {
    if (!token || !secret) return { success: false, error: 'missing_token_or_secret' };
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body: params
    });
    return resp.json();
}

export async function handler(event, context) {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const {
            filler_name,
            filler_mobile,
            filler_city,
            filler_taluka,
            filler_address,
            derasar_name,
            location_name,
            full_address,
            state,
            district,
            taluka,
            gmaps_link,
            trustees,
            pedhi_manager_name,
            pedhi_manager_mobile,
            poojari_name,
            poojari_mobile,
            mulnayak_name,
            mulnayak_photo_url,
            jinalay_photo_url,
            recaptchaToken
        } = payload;

        // 1. Verify reCAPTCHA
        const secret = process.env.RECAPTCHA_SECRET;
        const disableRecaptcha = String(process.env.DISABLE_RECAPTCHA_CHECK || '').toLowerCase() === 'true';

        if (!disableRecaptcha && secret) {
            const recResult = await verifyRecaptcha(recaptchaToken, secret);
            if (!recResult || !recResult.success || recResult.score < 0.5) {
                console.warn("reCAPTCHA failed:", recResult);
                return {
                    statusCode: 403,
                    body: JSON.stringify({ error: 'Recaptcha verification failed' })
                };
            }
        } else {
            console.log("Skipping reCAPTCHA verification (Disabled or Secret missing)");
        }

        // 2. Insert into Supabase (Pre-Survey Specific Project)
        const SURVEY_SUPABASE_URL = process.env.SUPABASE_URL_PRE_SURVEY;
        const SURVEY_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_PRE_SURVEY;

        if (!SURVEY_SUPABASE_URL || !SURVEY_SUPABASE_KEY) {
            console.error('Missing SUPABASE_URL_PRE_SURVEY or SUPABASE_SERVICE_ROLE_KEY_PRE_SURVEY');
            return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration: Missing Pre-Survey Envs' }) };
        }

        const supabase = createClient(
            SURVEY_SUPABASE_URL,
            SURVEY_SUPABASE_KEY
        );

        const insertData = {
            filler_name,
            filler_mobile,
            filler_city,
            filler_taluka,
            filler_address,
            derasar_name,
            location_name,
            full_address,
            state,
            district,
            taluka,
            gmaps_link,
            trustees, // JSONB array
            pedhi_manager_name,
            pedhi_manager_mobile,
            poojari_name,
            poojari_mobile,
            mulnayak_name,
            mulnayak_photo_url,
            jinalay_photo_url
        };

        const { data, error } = await supabase
            .from('temple_surveys')
            .insert([insertData])
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Database insertion failed', details: error.message })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data })
        };

    } catch (err) {
        console.error("Function Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: err.message })
        };
    }
}
