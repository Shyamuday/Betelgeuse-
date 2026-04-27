import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CreateDoctorRequest = {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  specialty: string;
  registrationNo?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ message: 'Supabase function environment is not configured.' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user }
  } = await userClient.auth.getUser();

  if (!user) {
    return json({ message: 'Authentication required.' }, 401);
  }

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'ADMIN') {
    return json({ message: 'Only admins can create doctors.' }, 403);
  }

  const body = (await req.json()) as CreateDoctorRequest;
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: body.email,
    password: body.password,
    phone: body.mobile,
    email_confirm: true,
    phone_confirm: Boolean(body.mobile)
  });

  if (createError || !created.user) {
    return json({ message: createError?.message || 'Could not create doctor auth user.' }, 400);
  }

  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: created.user.id,
    name: body.name,
    mobile: body.mobile || null,
    role: 'DOCTOR'
  });

  if (profileError) {
    return json({ message: profileError.message }, 400);
  }

  const { error: doctorError } = await adminClient.from('doctors').insert({
    profile_id: created.user.id,
    specialty: body.specialty,
    registration_no: body.registrationNo || null
  });

  if (doctorError) {
    return json({ message: doctorError.message }, 400);
  }

  return json({ doctorId: created.user.id });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
