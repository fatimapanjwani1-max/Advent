import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { format } from 'date-fns';
import { Building2, Calendar, CheckCircle2, Clock, AlertCircle, MapPin, Upload, FileText, Image as ImageIcon, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  progress_percentage: number;
  start_date: string;
  estimated_completion: string;
  client: { full_name: string };
  project_manager: { full_name: string };
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [milestones, setMilestones] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  
  const isAdmin = profile?.role === 'admin' || profile?.role === 'project_manager';

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client:profiles!projects_client_id_fkey(full_name),
          project_manager:profiles!projects_project_manager_id_fkey(full_name)
        `)
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData as any);

      // Fetch related data
      const [milestonesRes, photosRes, invoicesRes, budgetsRes] = await Promise.all([
        supabase.from('milestones').select('*').eq('project_id', id).order('due_date', { ascending: true }),
        supabase.from('photos').select('*').eq('project_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('project_id', id).order('issued_date', { ascending: false }),
        supabase.from('budgets').select('*').eq('project_id', id)
      ]);

      setMilestones(milestonesRes.data || []);
      setPhotos(photosRes.data || []);
      setInvoices(invoicesRes.data || []);
      setBudgets(budgetsRes.data || []);

    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (newProgress: number) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ progress_percentage: newProgress })
        .eq('id', id);

      if (error) throw error;
      setProject(prev => prev ? { ...prev, progress_percentage: newProgress } : null);
      toast.success('Progress updated');
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'invoice') => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${id}/${type}s/${fileName}`;

    try {
      toast.loading(`Uploading ${type}...`, { id: 'upload' });
      
      const { error: uploadError } = await supabase.storage
        .from('smartsite-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('smartsite-assets')
        .getPublicUrl(filePath);

      if (type === 'photo') {
        const { error: dbError } = await supabase
          .from('photos')
          .insert([{ project_id: id, image_url: publicUrl }]);
        if (dbError) throw dbError;
      } else {
        // For invoice, we'd normally prompt for amount, but keeping it simple here
        const { error: dbError } = await supabase
          .from('invoices')
          .insert([{ project_id: id, file_url: publicUrl, amount: 0, issued_date: new Date().toISOString() }]);
        if (dbError) throw dbError;
      }

      toast.success(`${type} uploaded successfully`, { id: 'upload' });
      fetchProjectDetails(); // Refresh data
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || `Failed to upload ${type}`, { id: 'upload' });
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

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-slate-900">Project not found</h2>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Building2 },
    { id: 'milestones', name: 'Milestones', icon: Calendar },
    { id: 'photos', name: 'Photos', icon: ImageIcon },
    { id: 'financials', name: 'Financials', icon: DollarSign },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {project.name}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-slate-500">
              <MapPin className="mr-1.5 h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
              {project.location}
            </div>
            <div className="mt-2 flex items-center text-sm text-slate-500">
              <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
              Due {format(new Date(project.estimated_completion), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${
            project.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
            project.status === 'active' ? 'bg-blue-100 text-blue-800' :
            project.status === 'delayed' ? 'bg-red-100 text-red-800' :
            'bg-slate-100 text-slate-800'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }
              `}
            >
              <tab.icon
                className={`
                  mr-2 h-5 w-5
                  ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}
                `}
                aria-hidden="true"
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Progress Card */}
            <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Project Progress</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-light text-slate-900">{project.progress_percentage}%</span>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <button onClick={() => handleProgressUpdate(Math.max(0, project.progress_percentage - 5))} className="px-2 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200">-</button>
                    <button onClick={() => handleProgressUpdate(Math.min(100, project.progress_percentage + 5))} className="px-2 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200">+</button>
                  </div>
                )}
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Client</dt>
                  <dd className="mt-1 text-sm text-slate-900">{project.client?.full_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Project Manager</dt>
                  <dd className="mt-1 text-sm text-slate-900">{project.project_manager?.full_name || 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-slate-900">{format(new Date(project.start_date), 'MMMM d, yyyy')}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Project Timeline</h3>
              {isAdmin && (
                <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  Add Milestone
                </button>
              )}
            </div>
            <ul role="list" className="divide-y divide-slate-200">
              {milestones.length > 0 ? milestones.map((milestone) => (
                <li key={milestone.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {milestone.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 mr-3" />
                      )}
                      <p className={`text-sm font-medium ${milestone.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {milestone.title}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                        {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </li>
              )) : (
                <li className="px-4 py-8 text-center text-slate-500 text-sm">No milestones added yet.</li>
              )}
            </ul>
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            {isAdmin && (
              <div className="mb-6">
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
                </label>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {photos.length > 0 ? photos.map((photo) => (
                <div key={photo.id} className="group aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-lg bg-slate-100 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-100">
                  <img src={photo.image_url} alt="" className="pointer-events-none object-cover group-hover:opacity-75 h-48 w-full" />
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-slate-500 text-sm border-2 border-dashed border-slate-300 rounded-lg">
                  No photos uploaded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
                <h3 className="text-lg font-medium leading-6 text-slate-900">Invoices</h3>
                {isAdmin && (
                  <label className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                    <Upload className="mr-1.5 h-3 w-3" />
                    Upload Invoice
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, 'invoice')} />
                  </label>
                )}
              </div>
              <ul role="list" className="divide-y divide-slate-200">
                {invoices.length > 0 ? invoices.map((invoice) => (
                  <li key={invoice.id} className="px-4 py-4 sm:px-6 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-slate-400 mr-3" />
                        <p className="text-sm font-medium text-blue-600 truncate">
                          <a href={invoice.file_url} target="_blank" rel="noopener noreferrer">
                            Invoice - {format(new Date(invoice.issued_date), 'MMM d, yyyy')}
                          </a>
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex items-center space-x-4">
                        <span className="text-sm font-medium text-slate-900">${invoice.amount.toLocaleString()}</span>
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </p>
                      </div>
                    </div>
                  </li>
                )) : (
                  <li className="px-4 py-8 text-center text-slate-500 text-sm">No invoices found.</li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                <h3 className="text-lg font-medium leading-6 text-slate-900">Budget Breakdown</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {budgets.length > 0 ? (
                  <div className="space-y-4">
                    {budgets.map((budget) => {
                      const percentage = Math.min(100, Math.round((budget.amount_used / budget.amount_allocated) * 100));
                      return (
                        <div key={budget.id}>
                          <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-slate-900">{budget.category}</span>
                            <span className="text-slate-500">${budget.amount_used.toLocaleString()} / ${budget.amount_allocated.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${percentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-sm">No budget data available.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
