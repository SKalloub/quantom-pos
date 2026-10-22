import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Users, UserPlus, Key, Shield, Trash2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'cashier' });
  const [editingId, setEditingId] = useState(null);
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    setUsers(data || []);
  }

  const handleAddUser = async (e) => {
    e.preventDefault();
    const cleanUsername = newUser.username.trim().toLowerCase();
    
    const { error } = await supabase.from('users').insert([{
      username: cleanUsername,
      password: newUser.password.trim(),
      name: newUser.name.trim() || cleanUsername,
      role: newUser.role
    }]);

    if (!error) {
      alert('تم إضافة المستخدم بنجاح ⚡');
      setNewUser({ username: '', password: '', name: '', role: 'cashier' });
      fetchUsers();
    } else {
      alert('حدث خطأ، قد يكون اسم المستخدم مكرراً!');
    }
  };

  const handleUpdatePassword = async (id) => {
    if (!newPass.trim()) return;
    const { error } = await supabase.from('users').update({ password: newPass.trim() }).eq('id', id);

    if (!error) {
      alert('تم تحديث كلمة السر بنجاح ⚡');
      setEditingId(null);
      setNewPass('');
      fetchUsers();
    } else {
      alert('حدث خطأ أثناء تعديل كلمة السر');
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (username === 'saeed') {
      alert('لا يمكن حذف حساب الأدمن الأساسي!');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم ${username}؟`)) return;

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      alert('تم الحذف بنجاح ⚡');
      fetchUsers();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* إضافة مستخدم جديد */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-3 text-quantum-dark">
          <UserPlus className="text-quantum-red" size={20} />
          إضافة موظف / مستخدم جديد
        </h2>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">اسم المستخدم (Login)</label>
            <input 
              type="text" 
              required
              placeholder="مثال: amir"
              value={newUser.username}
              onChange={e => setNewUser({...newUser, username: e.target.value})}
              className="w-full p-2.5 bg-quantum-bg rounded-xl border text-xs focus:border-quantum-red font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">اسم الموظف بالعربي</label>
            <input 
              type="text" 
              required
              placeholder="مثال: أمير"
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              className="w-full p-2.5 bg-quantum-bg rounded-xl border text-xs focus:border-quantum-red"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">كلمة السر</label>
            <input 
              type="text" 
              required
              placeholder="••••••••"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              className="w-full p-2.5 bg-quantum-bg rounded-xl border text-xs focus:border-quantum-red"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">الصلاحية (Role)</label>
            <select 
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value})}
              className="w-full p-2.5 bg-quantum-bg rounded-xl border text-xs focus:border-quantum-red font-bold"
            >
              <option value="cashier">كاشير (Cashier)</option>
              <option value="admin">مدير (Admin)</option>
            </select>
          </div>
          <div className="md:col-span-4 text-left">
            <button type="submit" className="bg-quantum-dark text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-quantum-red transition">
              حفظ المستخدم ⚡
            </button>
          </div>
        </form>
      </div>

      {/* قائمة المستخدمين وتغيير كلمات السر */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-3 text-quantum-dark">
          <Users className="text-quantum-red" size={20} />
          إدارة حسابات الموظفين ({users.length} مستخدمين)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-quantum-bg text-gray-700 font-bold border-b">
                <th className="py-3 px-4">اسم المستخدم</th>
                <th className="py-3 px-4">الاسم بالعربي</th>
                <th className="py-3 px-4 text-center">الصلاحية</th>
                <th className="py-3 px-4 text-center">كلمة السر الحالية</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-quantum-dark">{u.username}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800">{u.name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                      {u.role === 'admin' ? 'مدير (Admin)' : 'كاشير'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {editingId === u.id ? (
                      <input 
                        type="text" 
                        placeholder="كلمة السر الجديدة"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        className="w-28 p-1 border rounded text-center text-xs focus:border-quantum-red"
                      />
                    ) : (
                      <span>{u.password}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center flex justify-center gap-2">
                    {editingId === u.id ? (
                      <button onClick={() => handleUpdatePassword(u.id)} className="bg-green-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        تأكيد
                      </button>
                    ) : (
                      <button onClick={() => { setEditingId(u.id); setNewPass(u.password); }} className="bg-quantum-bg text-quantum-dark p-1.5 rounded-lg border hover:border-quantum-red" title="تغيير كلمة السر">
                        <Key size={14} />
                      </button>
                    )}
                    {u.username !== 'saeed' && (
                      <button onClick={() => handleDeleteUser(u.id, u.username)} className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100" title="حذف">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}