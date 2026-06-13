import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Briefcase, CheckCircle, Clock, Upload, X, Check, FileUp, Calendar } from 'lucide-react';
import './EmployeeDashboard.css';

export default function EmployeeDashboard() {
  const qc = useQueryClient();
  const location = useLocation();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', message: '', file: null });
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'ongoing', 'planned'

  const isProjectsPage = location.pathname === '/employee/projects';

  const { data, isLoading } = useQuery({
    queryKey: ['employeeProjects'],
    queryFn: () => api.get('/employee/projects'),
  });

  // ... (rest of the logic remains same)
  const updateProgressMutation = useMutation({
    mutationFn: ({ id, formData }) => api.post(`/employee/projects/${id}/progress`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      qc.invalidateQueries(['employeeProjects']);
      closeModal();
    },
    onError: (e) => alert(e?.message || 'Failed to update progress'),
  });

  const projects = data?.data || [];
  
  // Filter Logic
  const filteredProjects = filterStatus === 'all' 
    ? projects 
    : projects.filter(p => p.status === filterStatus);

  const completed = projects.filter(p => p.status === 'completed').length;
  const ongoing = projects.filter(p => p.status === 'ongoing').length;

  const openUpdateModal = (proj) => {
    setSelectedProject(proj);
    setUpdateForm({ status: proj.status, message: '', file: null });
    setShowUpdateModal(true);
  };

  const closeModal = () => {
    setShowUpdateModal(false);
    setSelectedProject(null);
    setUpdateForm({ status: '', message: '', file: null });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUpdateForm(f => ({ ...f, file: e.target.files[0] }));
    }
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!updateForm.message.trim()) return alert('Please enter a summary message');
    
    const formData = new FormData();
    formData.append('message', updateForm.message);
    formData.append('status', updateForm.status);
    if (updateForm.file) {
      formData.append('attachment', updateForm.file);
    }
    
    updateProgressMutation.mutate({ id: selectedProject._id, formData });
  };

  if (isLoading) return <div className="loading-screen animate-pulse-glow">Loading Dashboard...</div>;

  return (
    <div className={`dashboard-container animate-fade-in ${isProjectsPage ? 'projects-view' : ''}`}>
      <header className="page-header">
        <div>
          <h1>{isProjectsPage ? 'My Projects' : 'My Dashboard'}</h1>
          <p>
            {isProjectsPage 
              ? 'View all your assigned projects and manage their progress.' 
              : 'Track your assigned projects, submit updates, and upload finished work.'}
          </p>
        </div>
      </header>

      {!isProjectsPage && (
        <div className="stats-grid">
          <div 
            className={`stat-card glass-panel ${filterStatus === 'all' ? 'active-filter' : ''}`}
            onClick={() => setFilterStatus('all')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon-wrapper" style={{ background: '#3b82f6' }}>
              <Briefcase size={28} />
            </div>
            <div className="stat-info">
              <h3>Total Assigned</h3>
              <p className="stat-value">{projects.length}</p>
            </div>
          </div>
          <div 
            className={`stat-card glass-panel ${filterStatus === 'completed' ? 'active-filter' : ''}`}
            onClick={() => setFilterStatus('completed')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon-wrapper" style={{ background: '#10b981' }}>
              <CheckCircle size={28} />
            </div>
            <div className="stat-info">
              <h3>Completed</h3>
              <p className="stat-value">{completed}</p>
            </div>
          </div>
          <div 
            className={`stat-card glass-panel ${filterStatus === 'ongoing' ? 'active-filter' : ''}`}
            onClick={() => setFilterStatus('ongoing')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon-wrapper" style={{ background: '#f59e0b' }}>
              <Clock size={28} />
            </div>
            <div className="stat-info">
              <h3>Ongoing</h3>
              <p className="stat-value">{ongoing}</p>
            </div>
          </div>
        </div>
      )}

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>{isProjectsPage ? 'All Projects' : 'My Projects Timeline'}</h2>
        {filterStatus !== 'all' && !isProjectsPage && (
          <button 
            className="btn-ghost" 
            onClick={() => setFilterStatus('all')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <X size={14} /> Clear Filter ({filterStatus})
          </button>
        )}
      </div>

      <div className="projects-grid">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((proj) => (
            <div key={proj._id} className="project-card premium-card animate-fade-in">
              <div className="card-top">
                <span className={`status-tag status-${proj.status}`}>{proj.status}</span>
                <span className="proj-id">ID: {proj.projectId}</span>
              </div>
              
              <div className="card-content">
                <h3 className="proj-title">{proj.projectName}</h3>
                <p className="proj-description">{proj.description}</p>
                
                <div className="card-grid-meta">
                  <div className="meta-box">
                    <Calendar size={14} />
                    <div>
                      <label>Timeline</label>
                      <span>{new Date(proj.startDate).toLocaleDateString()} - {new Date(proj.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="meta-box">
                    <Check size={14} />
                    <div>
                      <label>Progress</label>
                      <span>{proj.updates?.length || 0} updates submitted</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button className="submit-progress-btn" onClick={() => openUpdateModal(proj)}>
                  <Upload size={18} />
                  <span>Submit Progress</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-card glass-panel" style={{ gridColumn: '1 / -1' }}>
            <Briefcase size={40} className="accent-icon" />
            <p>No projects assigned to you yet.</p>
          </div>
        )}
      </div>

      {showUpdateModal && selectedProject && (
        <div className="emp-modal-overlay" onClick={closeModal}>
          <div className="emp-modal absolute-center" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <div className="emp-modal-icon">
                <Briefcase size={26} />
              </div>
              <div>
                <h2>Submit Progress Update</h2>
                <p>Update the status and provide details for <strong>{selectedProject.projectName}</strong></p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="emp-form">
              <div className="emp-form-grid">
                <div className="form-field full-span">
                  <label><Briefcase size={14} /> Project Name</label>
                  <input value={selectedProject.projectName} disabled className="bg-gray-50" />
                </div>
                
                <div className="form-field full-span">
                  <label><FileUp size={14} /> Summary of Work Completed *</label>
                  <textarea 
                    value={updateForm.message} 
                    onChange={(e) => setUpdateForm({...updateForm, message: e.target.value})}
                    rows={4} 
                    required
                    placeholder="Describe what you worked on, milestones hit, etc..."
                  />
                </div>

                <div className="form-field">
                  <label><Clock size={14} /> Update Status</label>
                  <select 
                    value={updateForm.status} 
                    onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                  >
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed (Final Work)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label><Upload size={14} /> Attachment / Proof</label>
                  <div className="upload-box" style={{ padding: '0.5rem' }}>
                    <input 
                      type="file" 
                      className="upload-input" 
                      onChange={handleFileChange}
                      accept="*/*"
                    />
                    <div className="upload-label" style={{ flexDirection: 'row', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <FileUp size={20} />
                      {updateForm.file ? (
                        <span className="file-name">{updateForm.file.name}</span>
                      ) : (
                        <span>Click to upload</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="emp-modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={updateProgressMutation.isPending}>
                  <Check size={16} />
                  {updateProgressMutation.isPending ? 'Uploading...' : 'Submit Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
