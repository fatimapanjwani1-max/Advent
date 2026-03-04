import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Profile[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    project_manager_id: '',
    location: '',
    start_date: '',
    estimated_completion: '',
    status: 'planning',
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'client');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      const { data: managersData, error: managersError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'project_manager']);

      if (managersError) throw managersError;
      setManagers(managersData || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load users');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            ...formData,
            progress_percentage: 0,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Project created successfully');
      navigate(`/projects/${data.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Create New Project
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8 divide-y divide-slate-200">
        <div className="space-y-8 divide-y divide-slate-200 sm:space-y-5">
          <div className="space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-slate-900">Project Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Provide the basic details for the new construction project.
              </p>
            </div>

            <div className="space-y-6 sm:space-y-5">
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-slate-200 sm:pt-5">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 sm:mt-px sm:pt-2">
                  Project Name
                </label>
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full max-w-lg rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:max-w-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-slate-200 sm:pt-5">
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 sm:mt-px sm:pt-2">
                  Location
                </label>
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full max-w-lg rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:max-w-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-slate-200 sm:pt-5">
                <label htmlFor="client_id" className="block text-sm font-medium text-slate-700 sm:mt-px sm:pt-2">
                  Client
                </label>
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <select
                    id="client_id"
                    name="client_id"
                    required
                    value={formData.client_id}
                    onChange={handleChange}
                    className="block w-full max-w-lg rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:max-w-xs sm:text-sm"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-slate-200 sm:pt-5">
                <label htmlFor="project_manager_id" className="block text-sm font-medium text-slate-700 sm:mt-px sm:pt-2">
                  Project Manager
                </label>
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <select
                    id="project_manager_id"
                    name="project_manager_id"
                    required
                    value={formData.project_manager_id}
                    onChange={handleChange}
                    className="block w-full max-w-lg rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:max-w-xs sm:text-sm"
                  >
                    <option value="">Select a manager</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-slate-200 sm:pt-5">
                <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 sm:mt-px sm:pt-2">
                  Start Date
                </label>
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    required
                    value={formData.start_date}
                    onChange={handleChange}
                    className="block w-full max-w-lg rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:max-w-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-slate-200 sm:pt-5">
                <label htmlFor="estimated_completion" className="block text-sm font-medium text-slate-700 sm:mt-px sm:pt-2">
                  Estimated Completion
                </label>
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <input
                    type="date"
                    name="estimated_completion"
                    id="estimated_completion"
                    required
                    value={formData.estimated_completion}
                    onChange={handleChange}
                    className="block w-full max-w-lg rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:max-w-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-slate-200 sm:pt-5">
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 sm:mt-px sm:pt-2">
                  Status
                </label>
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="block w-full max-w-lg rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:max-w-xs sm:text-sm"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {loading ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
