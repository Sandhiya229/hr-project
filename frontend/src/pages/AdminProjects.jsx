import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { FolderPlus, Pencil, Trash2, X, Check, Users, Hash, Calendar, DollarSign, FileText } from 'lucide-react';
import './AdminProjects.css';

const EMPTY_FORM = {
  projectId: '', projectName: '', description: '', startDate: '', endDate: '', projectValue: '',
};

export default function AdminProjects() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [assignProjectId, setAssignProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: projData, isLoading } = useQuery({
    queryKey: ['adminProjects'],
    queryFn: () => api.get('/admin/projects'),
  });

  const { data: empData } = useQuery({
    queryKey: ['adminEmployees'],
    queryFn: () => api.get('/admin/employees?limit=100'),
  });

  const projects = projData?.data || [];
  const employees = empData?.data?.employees || [];
  const [searchQuery, setSearchQuery] = useState('');

  const generateNextProjectId = () => {
    if (!projects || projects.length === 0) return 'PRJ-001';

    const numbers = projects.map((proj) => {
      const match = proj.projectId?.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const nextNumber = Math.max(...numbers, 0) + 1;
    return `PRJ-${String(nextNumber).padStart(3, '0')}`;
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(proj => 
    proj.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proj.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getBadgeClass = (proj) => {
    if (proj.status === 'completed') return 'status-completed';
    if (proj.endDate) {
      const end = new Date(proj.endDate);
      const now = new Date();
      const diffDays = (end - now) / (1000 * 60 * 60 * 24);
      if (diffDays <= 3 && proj.status !== 'completed') return 'status-danger';
    }
    return `status-${proj.status}`;
  };

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/admin/projects', body),
    onSuccess: () => { qc.invalidateQueries(['adminProjects']); closeModal(); },
    onError: (e) => setError(e?.message || 'Failed to create project'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api.put(`/admin/projects/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['adminProjects']); closeModal(); },
    onError: (e) => setError(e?.message || 'Failed to update project'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/projects/${id}`),
    onSuccess: () => qc.invalidateQueries(['adminProjects']),
    onError: (e) => setError(e?.message || 'Delete failed'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, employeeIds }) => api.post(`/admin/projects/${id}/assign`, { employeeIds }),
    onSuccess: () => { qc.invalidateQueries(['adminProjects']); setShowAssignModal(false); },
    onError: (e) => setError(e?.message || 'Assign failed'),
  });

  const openCreate = () => { 
    setForm({ 
      ...EMPTY_FORM, 
      projectId: generateNextProjectId(),
      startDate: new Date().toISOString().split('T')[0]
    }); 
    setEditId(null); 
    setError(''); 
    setShowModal(true); 
  };
  const openEdit = (proj) => {
    setForm({
      projectId: proj.projectId,
      projectName: proj.projectName,
      description: proj.description,
      startDate: proj.startDate?.slice(0, 10) || '',
      endDate: proj.endDate?.slice(0, 10) || '',
      projectValue: proj.projectValue,
    });
    setEditId(proj._id);
    setError('');
    setShowModal(true);
  };
  
  const openAssign = (proj) => {
    setAssignProjectId(proj._id);
    setSelectedEmployees(proj.assignedEmployees?.map((e) => e._id) || []);
    setError('');
    setShowAssignModal(true);
  };
  
  const openProgress = (proj) => {
    setSelectedProject(proj);
    setShowProgressModal(true);
  };
  
  const closeModal = () => { setShowModal(false); setEditId(null); setError(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, projectValue: Number(form.projectValue) };
    if (editId) {
      updateMutation.mutate({ id: editId, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const toggleEmployee = (id) => {
    // Only allow selecting one employee at a time
    setSelectedEmployees([id]);
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  if (isLoading) return <div className="loading-screen animate-pulse-glow">Loading Projects...</div>;

  return (
    <div className="proj-page">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Create, manage, and assign projects to your workforce efficiently.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search by ID, name, or desc..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: '0.6rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              background: 'var(--surface)', 
              color: 'var(--text-light)', 
              width: '260px',
              outline: 'none'
            }}
          />
          <button className="btn-primary" onClick={openCreate}>
            <FolderPlus size={18} />
            Add New Project
          </button>
        </div>
      </header>

      <div className="projects-grid">
        {filteredProjects.length > 0 ? filteredProjects.map((proj) => (
          <div key={proj._id} className="project-card glass-panel">
            <div className="proj-card-header">
              <div>
                <span className="proj-id">{proj.projectId}</span>
                <h3 className="proj-name">{proj.projectName}</h3>
              </div>
              <span className={`status-badge ${getBadgeClass(proj)}`}>
                {getBadgeClass(proj) === 'status-danger' ? 'Near Deadline' : proj.status}
              </span>
            </div>
            
            <p className="proj-desc">{proj.description}</p>
            
            <div className="proj-meta">
              <div className="proj-meta-item">
                <span className="meta-label">Start Date</span>
                <span>{new Date(proj.startDate).toLocaleDateString()}</span>
              </div>
              <div className="proj-meta-item">
                <span className="meta-label">End Date</span>
                <span>{new Date(proj.endDate).toLocaleDateString()}</span>
              </div>
              <div className="proj-meta-item">
                <span className="meta-label">Budget Value</span>
                <span className="proj-value">₹{proj.projectValue?.toLocaleString()}</span>
              </div>
              <div className="proj-meta-item">
                <span className="meta-label">Team Size</span>
                <span>{proj.assignedEmployees?.length || 0} members</span>
              </div>
            </div>

            {proj.assignedEmployees?.length > 0 && (
              <div className="assigned-list">
                {proj.assignedEmployees.map((emp) => (
                  <span key={emp._id} className="emp-chip">{emp.name || emp.employeeId}</span>
                ))}
              </div>
            )}
            
            <div className="proj-card-actions">
              <button className="btn-secondary" onClick={() => openProgress(proj)}>
                <Check size={14} /> Progress ({proj.updates?.length || 0})
              </button>
              <button className="btn-secondary" onClick={() => openAssign(proj)}>
                <Users size={14} /> Team
              </button>
              <button className="btn-ghost" onClick={() => openEdit(proj)}>
                <Pencil size={15} /> Edit
              </button>
              <button className="btn-ghost danger" onClick={() => deleteMutation.mutate(proj._id)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        )) : (
          <div className="empty-card glass-panel">
            <FolderPlus size={40} className="accent-icon" />
            <p>No projects yet. Click "Add New Project" to get started!</p>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT PROJECT MODAL --- */}
      {showModal && (
        <div className="emp-modal-overlay" onClick={closeModal}>
          <div className="emp-modal absolute-center" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <div className="emp-modal-icon">
                <FolderPlus size={26} />
              </div>
              <div>
                <h2>{editId ? 'Edit Project Details' : 'Add New Project'}</h2>
                <p>{editId ? 'Update project information below.' : 'Create a fresh project assignment for the team.'}</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="emp-form-grid">

                <div className="form-field full-span">
                  <label><Hash size={14} /> Project ID</label>
                  <input name="projectId" value={form.projectId} onChange={onChange} placeholder="e.g. PRJ-001" required disabled={!!editId} />
                </div>

                <div className="form-field full-span">
                  <label><FileText size={14} /> Project Name</label>
                  <input name="projectName" value={form.projectName} onChange={onChange} placeholder="e.g. E-Commerce Website Redesign" required minLength={2} />
                </div>

                <div className="form-field full-span">
                  <label><FileText size={14} /> Detailed Description</label>
                  <textarea name="description" value={form.description} onChange={onChange} placeholder="Briefly describe what this project is trying to achieve..." required rows={3} style={{ resize: 'vertical' }} />
                </div>

                <div className="form-field">
                  <label><Calendar size={14} /> Start Date</label>
                  <input name="startDate" type="date" value={form.startDate} onChange={onChange} required />
                </div>

                <div className="form-field">
                  <label><Calendar size={14} /> Target End Date</label>
                  <input name="endDate" type="date" value={form.endDate} onChange={onChange} required />
                </div>

                <div className="form-field">
                  <label><DollarSign size={14} /> Project Budget / Value</label>
                  <input name="projectValue" type="number" value={form.projectValue} onChange={onChange} placeholder="e.g. 150000" required min={0} />
                </div>

                {editId && (
                  <div className="form-field">
                    <label>Current Status</label>
                    <select name="status" value={form.status || 'planned'} onChange={onChange}>
                      <option value="planned">Planned (Not Started)</option>
                      <option value="ongoing">Ongoing (In Progress)</option>
                      <option value="completed">Completed (Successfully Done)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="emp-modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Check size={16} />
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editId ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSIGN EMPLOYEES MODAL --- */}
      {showAssignModal && (
        <div className="emp-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="emp-modal absolute-center" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="emp-modal-header">
              <div className="emp-modal-icon">
                <Users size={26} />
              </div>
              <div>
                <h2>Assign Team Members</h2>
                <p>Select the employees who will be working on this project.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAssignModal(false)}><X size={20} /></button>
            </div>
            
            {error && <div className="form-error">{error}</div>}
            
            <div className="assign-list">
              {employees.length > 0 ? employees.map((emp) => (
                <label key={emp._id} className={`assign-item ${selectedEmployees.includes(emp._id) ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="employeeSelect"
                    checked={selectedEmployees.includes(emp._id)}
                    onChange={() => toggleEmployee(emp._id)}
                  />
                  <div>
                    <strong>{emp.name} ({emp.employeeId})</strong>
                    <span>{emp.designation} — {emp.department}</span>
                  </div>
                </label>
              )) : <p className="empty-state">No employees available. Add employees first!</p>}
            </div>
            
            <div className="emp-modal-actions">
              <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={assignMutation.isPending || selectedEmployees.length === 0}
                onClick={() => assignMutation.mutate({ id: assignProjectId, employeeIds: selectedEmployees })}
              >
                <Check size={16} /> {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW PROGRESS TIMELINE MODAL --- */}
      {showProgressModal && selectedProject && (
        <div className="emp-modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="emp-modal absolute-center" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <div className="emp-modal-icon">
                <FolderPlus size={26} />
              </div>
              <div>
                <h2>Sprint Timeline</h2>
                <p>Updates submitted for: {selectedProject.projectName}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowProgressModal(false)}><X size={20} /></button>
            </div>
            
            <div className="updates-timeline">
              {!selectedProject.updates || selectedProject.updates.length === 0 ? (
                <div className="empty-card" style={{ padding: '3rem 0' }}>No updates submitted by the assigned team members yet.</div>
              ) : (
                selectedProject.updates.slice().reverse().map((update, idx) => (
                  <div key={idx} className="project-card" style={{ background: 'var(--surface)', padding: '1.25rem', marginBottom: '1rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <strong style={{ color: 'var(--primary-color)' }}>{update.user?.email || 'Employee'}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(update.date).toLocaleString()}</span>
                    </div>
                    
                    <p style={{ margin: '0.5rem 0', lineHeight: 1.6, color: 'var(--text-dark)' }}>{update.message}</p>
                    
                    {update.attachmentUrl && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <a 
                          href={update.attachmentUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-primary" 
                          style={{ display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          <FolderPlus size={16} style={{ marginRight: '0.5rem'}} />
                          Download Attachment: {update.fileName || 'View Uploaded File'}
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="emp-modal-actions" style={{ marginTop: '0' }}>
              <button className="btn-secondary full-width" onClick={() => setShowProgressModal(false)}>Close Timeline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
