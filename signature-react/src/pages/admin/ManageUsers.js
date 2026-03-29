/**
 * pages/admin/ManageUsers.js
 * Table of all registered users with activate / delete actions.
 */
import React, { useEffect, useState } from 'react';
import { getUsers, activateUser, deleteUser } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';
import Spinner from '../../components/Spinner';
import '../user/UserLayout.css';
import './ManageUsers.css';

export default function ManageUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Token is attached automatically by the Axios interceptor
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users. Please check your admin session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleActivate = async (id) => {
    try {
      const res = await activateUser(id);
      setActionMsg(res.data.message);
      fetchUsers();
    } catch { setActionMsg('Activation failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await deleteUser(id);
      setActionMsg(res.data.message);
      fetchUsers();
    } catch { setActionMsg('Deletion failed.'); }
  };

  const waiting   = users.filter(u => u.status === 'waiting');
  const activated = users.filter(u => u.status === 'activated');

  return (
    <div className="user-layout">
      <AdminSidebar />
      <main className="user-main">
        <div className="page-header">
          <h1>👥 Manage Users</h1>
          <p>Activate pending accounts or remove users</p>
        </div>

        {actionMsg && (
          <div className="alert-banner" onClick={() => setActionMsg('')}>
            ✅ {actionMsg} <span style={{float:'right', cursor:'pointer'}}>✕</span>
          </div>
        )}

        {error && <div style={{ color:'#ff6b6b', marginBottom:'1rem' }}>{error}</div>}

        {loading ? <Spinner text="Loading users..." /> : (
          <>
            {/* Stats row */}
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-value">{users.length}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{color:'#ffd700'}}>{waiting.length}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{color:'#00ffc8'}}>{activated.length}</div>
                <div className="stat-label">Activated</div>
              </div>
            </div>

            {/* Users table */}
            <div className="table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Login ID</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Locality</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={8} style={{textAlign:'center', color:'#aaa', padding:'2rem'}}>No users registered yet.</td></tr>
                  ) : users.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td>{u.name}</td>
                      <td>{u.loginid}</td>
                      <td>{u.mobile}</td>
                      <td>{u.email}</td>
                      <td>{u.locality}</td>
                      <td>
                        <span className={`status-badge ${u.status}`}>
                          {u.status === 'waiting' ? '⏳ Waiting' : '✅ Active'}
                        </span>
                      </td>
                      <td className="action-cell">
                        {u.status === 'waiting' ? (
                          <button className="btn-activate" onClick={() => handleActivate(u.id)}>
                            Activate
                          </button>
                        ) : (
                          <button className="btn-delete" onClick={() => handleDelete(u.id)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
