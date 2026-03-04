import { createClient } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';
import Layout from '@/src/components/Layout';
import AdminDashboard from '@/src/components/AdminDashboard';
import ClientDashboard from '@/src/components/ClientDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('[Page] No user found, redirecting to /login');
    redirect('/login');
  }

  // Fetch profile safely
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[Page] Profile fetch error:', profileError);
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Profile not found</h1>
          <p className="text-slate-500 mb-6">We couldn't find your user profile. Please try logging out and back in.</p>
          <form action="/api/auth/signout" method="post">
            <button className="text-blue-600 font-medium hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  // Fetch projects based on role
  let projectsQuery = supabase
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (profile.role === 'project_manager') {
    projectsQuery = projectsQuery.eq('project_manager_id', user.id);
  } else if (profile.role === 'client') {
    projectsQuery = projectsQuery.eq('client_id', user.id);
  }

  const { data: projects, error: projectsError } = await projectsQuery;

  if (projectsError) {
    console.error('[Page] Projects fetch error:', projectsError);
  }

  return (
    <Layout>
      {profile.role === 'admin' || profile.role === 'project_manager' ? (
        <AdminDashboard projects={projects || []} profile={profile} />
      ) : (
        <ClientDashboard projects={projects || []} profile={profile} />
      )}
    </Layout>
  );
}

