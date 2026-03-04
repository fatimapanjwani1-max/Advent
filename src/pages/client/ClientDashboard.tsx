import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import { Building2, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  progress_percentage: number;
  start_date: string;
  estimated_completion: string;
}

export default function ClientDashboard() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'active': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'delayed': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Calendar className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-slate-900">My Projects</h1>
          <p className="mt-2 text-sm text-slate-700">
            Welcome back, {profile?.full_name}. Here is the status of your construction projects.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="col-span-1 flex flex-col divide-y divide-slate-200 rounded-2xl bg-white text-center shadow-sm transition-shadow hover:shadow-md border border-slate-100"
          >
            <div className="flex flex-1 flex-col p-8">
              <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-slate-900">{project.name}</h3>
              <dl className="mt-1 flex flex-grow flex-col justify-between">
                <dt className="sr-only">Location</dt>
                <dd className="text-sm text-slate-500">{project.location}</dd>
                <dt className="sr-only">Status</dt>
                <dd className="mt-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1.5">{project.status}</span>
                  </span>
                </dd>
              </dl>
              
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-900">Progress</span>
                  <span className="text-slate-500">{project.progress_percentage}%</span>
                </div>
                <div className="mt-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-500 ease-in-out"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="-mt-px flex divide-x divide-slate-200">
                <div className="flex w-0 flex-1">
                  <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-slate-900">
                    <Calendar className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    {project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'TBD'}
                  </div>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <div className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-slate-900">
                    <Clock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    {project.estimated_completion ? format(new Date(project.estimated_completion), 'MMM d, yyyy') : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {projects.length === 0 && (
        <div className="mt-8 text-center rounded-2xl border-2 border-dashed border-slate-300 p-12">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No active projects</h3>
          <p className="mt-1 text-sm text-slate-500">You don't have any projects assigned to you yet.</p>
        </div>
      )}
    </Layout>
  );
}
