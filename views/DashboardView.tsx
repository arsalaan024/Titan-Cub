
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User } from '../types';

const DashboardView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await db.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await db.updateUserStatus(userId, nextStatus as any);
      await fetchUsers();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  if (loading) return <div className="py-24 text-center font-bold uppercase tracking-widest opacity-50">Syncing Registry...</div>;

  return (
    <div className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">Titan Oversight</h2>
          <p className="text-gray-500 mt-2 text-lg font-medium">Control center for account statuses and system-wide security.</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                <th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Access State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center text-maroon-800 font-black uppercase text-xs">{u.name?.charAt(0) || '?'}</div>
                      <span className="font-black text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-12 py-8 text-gray-500 font-bold">{u.email}</td>
                  <td className="px-12 py-8"><span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">{u.role}</span></td>
                  <td className="px-12 py-8 text-center">
                    <button onClick={() => toggleStatus(u.id, u.status)} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${u.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                      {u.status === 'active' ? 'Revoke Access' : 'Activate ID'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
