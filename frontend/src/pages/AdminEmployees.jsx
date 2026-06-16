import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { UserPlus, Pencil, Trash2, X, Check, User, Briefcase, Phone, Building2, Calendar, DollarSign, Hash, Key, Mail, Droplets, Users } from 'lucide-react';
import './AdminEmployees.css';

const today = new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  employeeId: '', name: '', email: '',
  dateOfBirth: today, joiningDate: today, phone: '',
  gender: 'Male', bloodGroup: 'O+',
  department: '', designation: '', basicPay: '',
};

export default function AdminEmployees() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [createdCreds, setCreatedCreds] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(''); // Added search state

  const { data, isLoading } = useQuery({
    queryKey: ['adminEmployees'],
    queryFn: () => api.get('/admin/employees?limit=100'),
  });

  const employees = data?.data?.employees || [];
  
  // Filter employees based on search query
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.user?.email && emp.user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/admin/employees', body),
    onSuccess: (res) => {
      qc.invalidateQueries(['adminEmployees']);
      setShowModal(false);
      setForm(EMPTY_FORM);
      const d = res?.data;
      if (d?.loginPassword) setCreatedCreds({ email: d.loginEmail, password: d.loginPassword });
    },
    onError: (e) => setError(e?.message || 'Failed to create employee'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api.put(`/admin/employees/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['adminEmployees']); closeModal(); },
    onError: (e) => setError(e?.message || 'Failed to update employee'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/employees/${id}`),
    onSuccess: () => qc.invalidateQueries(['adminEmployees']),
  });

  const generateNextEmployeeId = () => {
    if (!employees || employees.length === 0) return 'EMP001';
    
    // Extract numbers from existing employee IDs to find the highest one
    const numbers = employees.map(emp => {
      const match = emp.employeeId.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    const nextNumber = maxNumber + 1;
    
    // Format as EMP001, EMP002, etc.
    return `EMP${String(nextNumber).padStart(3, '0')}`;
  };

  const openCreate = () => { 
    setForm({ ...EMPTY_FORM, employeeId: generateNextEmployeeId() }); 
    setEditId(null); 
    setError(''); 
    setShowModal(true); 
  };
  
  const openEdit = (emp) => {
    setForm({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email || emp.user?.email || '',
      dateOfBirth: emp.dateOfBirth?.slice(0, 10) || '',
      joiningDate: emp.joiningDate?.slice(0, 10) || '',
      phone: emp.phone || '',
      gender: emp.gender || 'Male',
      bloodGroup: emp.bloodGroup || '',
      department: emp.department,
      designation: emp.designation,
      basicPay: emp.basicPay,
    });
    setEditId(emp._id);
    setError('');
    setShowModal(true);
  };
  
  const closeModal = () => { setShowModal(false); setEditId(null); setError(''); };
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, basicPay: Number(form.basicPay) };
    if (editId) {
      const { employeeId, ...rest } = body;
      updateMutation.mutate({ id: editId, body: rest });
    } else {
      createMutation.mutate(body);
    }
  };

  if (isLoading) return <div className="loading-screen animate-pulse-glow">Loading Employees...</div>;

  return (
    <div className="emp-page">
      <header className="page-header">
        <div>
          <h1>Employees</h1>
          <p>Manage your workforce — add, edit, or remove employees.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search by name, ID, or email..." 
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
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>
      </header>

      {createdCreds && (
        <div className="creds-banner">
          <div className="creds-content">
            <Key size={20} className="creds-icon" />
            <div>
              <strong>Employee account created & Welcome Email Sent!</strong>
              <span>Login: <code>{createdCreds.email}</code> / Auto-Generated Password: <code>{createdCreds.password}</code></span>
            </div>
          </div>
          <button className="icon-btn" onClick={() => setCreatedCreds(null)}><X size={16} /></button>
        </div>
      )}

      <div className="glass-panel table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '1.5rem', paddingRight: '2rem', width: '100px' }}>ID</th>
              <th>Name</th>
              <th>Date of Joining</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Phone</th>
              <th>Basic Pay</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
              <tr key={emp._id}>
                <td style={{ paddingLeft: '1.5rem', paddingRight: '2rem' }}><strong>{emp.employeeId}</strong></td>
                <td>
                  <div>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email || emp.user?.email}</div>
                </td>
                <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '-'}</td>
                <td>{emp.department}</td>
                <td>{emp.designation}</td>
                <td>{emp.phone || '-'}</td>
                <td>₹{emp.basicPay?.toLocaleString()}</td>
                <td>
                  <div className="action-btns">
                    <button className="btn-ghost" title="Update" onClick={() => openEdit(emp)}>
                      <Pencil size={15} /> Update
                    </button>
                    <button className="btn-ghost danger" title="Delete" onClick={() => deleteMutation.mutate(emp._id)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="8" className="empty-state">No employees yet. Click "Add Employee" to get started!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && <div className="emp-modal-overlay" onClick={closeModal}>
          <div className="emp-modal glass-body" onClick={(e) => e.stopPropagation()}>
            <div className="content-wrapper reveal animate-fade-in">
              <div className="emp-modal-icon">
                <UserPlus size={26} />
              </div>
              <div>
                <h2>{editId ? 'Edit Employee' : 'Add New Employee'}</h2>
                <p>{editId ? 'Update employee information below.' : 'Fill in the details to onboard a new team member.'}</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="emp-form-grid">

                <div className="form-field full-span">
                  <label><Hash size={14} /> Employee ID</label>
                  <input name="employeeId" value={form.employeeId} onChange={onChange} placeholder="e.g. EMP001" required disabled={!!editId} />
                  {!editId && <span className="field-hint">Password will be auto-generated (initials + DDMM from DOB) and emailed.</span>}
                </div>

                <div className="form-field">
                  <label><User size={14} /> Full Name</label>
                  <input name="name" value={form.name} onChange={onChange} placeholder="e.g. Jane Doe" required minLength={2} />
                </div>

                <div className="form-field">
                  <label><Mail size={14} /> Email ID</label>
                  <input name="email" type="email" value={form.email} onChange={onChange} placeholder="e.g. jane.doe@gmail.com" required />
                </div>

                <div className="form-field">
                  <label><Calendar size={14} /> Date of Birth</label>
                  <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={onChange} required />
                </div>

                <div className="form-field">
                  <label><Users size={14} /> Gender</label>
                  <select name="gender" value={form.gender} onChange={onChange} required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label><Phone size={14} /> Phone Number</label>
                  <input name="phone" value={form.phone} onChange={onChange} placeholder="e.g. 9876543210" required />
                </div>

                <div className="form-field">
                  <label><Droplets size={14} /> Blood Group</label>
                  <select name="bloodGroup" value={form.bloodGroup} onChange={onChange} required>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-field">
                  <label><Building2 size={14} /> Department</label>
                  <input name="department" value={form.department} onChange={onChange} placeholder="e.g. Web Development" required />
                </div>

                <div className="form-field">
                  <label><Briefcase size={14} /> Designation</label>
                  <input name="designation" value={form.designation} onChange={onChange} placeholder="e.g. Senior Engineer" required />
                </div>
                
                <div className="form-field">
                  <label><Calendar size={14} /> Date of Joining</label>
                  <input name="joiningDate" type="date" value={form.joiningDate} onChange={onChange} required />
                </div>

                <div className="form-field full-span">
                  <label><DollarSign size={14} /> Basic Pay</label>
                  <input name="basicPay" type="number" value={form.basicPay} onChange={onChange} placeholder="e.g. 60000" required min={0} />
                </div>

              </div>

              <div className="emp-modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Check size={16} />
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editId ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
