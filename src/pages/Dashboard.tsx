import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import ClientDashboard from './client/ClientDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  if (!profile) return null;

  if (profile.role === 'admin' || profile.role === 'project_manager') {
    return <AdminDashboard />;
  }

  return <ClientDashboard />;
}
