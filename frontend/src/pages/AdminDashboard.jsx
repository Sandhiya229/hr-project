import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { Users, Briefcase, CheckCircle, Clock, X } from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats'),
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['adminProjects'],
    queryFn: () => api.get('/admin/projects'),
  });

  if (statsLoading || projectsLoading) {
    return <div className="loading-screen animate-pulse-glow">Loading Dashboard...</div>;
  }

  const { totalEmployees, totalProjects, completedProjects, ongoingProjects } = statsData?.data || {};
  const projects = projectsData?.data || [];
  
  // Filter Logic
  const displayProjects = filterStatus === 'all'
    ? [...projects].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    : projects.filter(p => p.status === filterStatus);

  const statCards = [
    { id: 'employees-count', title: 'Total Employees', value: totalEmployees || 0, icon: <Users size={24} className="accent-icon" />, bg: 'var(--accent-light)' },
    { id: 'all', title: 'Total Projects', value: totalProjects || 0, icon: <Briefcase size={24} style={{ color: 'var(--accent)' }} />, bg: 'var(--accent-light)' },
    { id: 'completed', title: 'Completed Projects', value: completedProjects || 0, icon: <CheckCircle size={24} style={{ color: 'var(--success)' }} />, bg: 'var(--success-light)' },
    { id: 'ongoing', title: 'Ongoing Projects', value: ongoingProjects || 0, icon: <Clock size={24} style={{ color: 'var(--warning)' }} />, bg: 'var(--warning-light)' },
  ];

  const projectFilterIds = ['all', 'completed', 'ongoing'];

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <h1>Admin Overview</h1>
        <p>Monitor your company's high-level metrics.</p>
      </header>

      <div className="stats-grid animate-fade-in">
        {statCards.map((stat) => (
          <div 
            key={stat.id} 
            className={`stat-card glass-panel ${filterStatus === stat.id ? 'active-filter' : ''} ${projectFilterIds.includes(stat.id) ? 'clickable-stat' : ''}`}
            onClick={() => projectFilterIds.includes(stat.id) && setFilterStatus(stat.id)}
            style={{ cursor: projectFilterIds.includes(stat.id) ? 'pointer' : 'default' }}
          >
            <div className="stat-icon-wrapper" style={{ background: stat.bg }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-section glass-panel animate-fade-in">
        <div className="section-header flex-between">
          <h2>{filterStatus === 'all' ? 'Recent Projects' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Projects`}</h2>
          {filterStatus !== 'all' && (
            <button className="btn-ghost flex-center" onClick={() => setFilterStatus('all')}>
              <X size={14} /> Clear Filter
            </button>
          )}
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {displayProjects.length > 0 ? (
                displayProjects.map((proj) => (
                  <tr key={proj._id}>
                    <td><strong>{proj.projectId}</strong></td>
                    <td>{proj.projectName}</td>
                    <td>
                      <span className={`status-badge status-${proj.status}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td>{new Date(proj.startDate).toLocaleDateString()}</td>
                    <td>₹{proj.projectValue?.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">No {filterStatus} projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
