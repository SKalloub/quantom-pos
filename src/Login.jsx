import React, { useState } from 'react';
import { supabase } from './supabase';
import { LogIn, Lock, User } from 'lucide-react';
import quantumLogo from './assets/quantum.svg';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', cleanUsername)
      .eq('password', password)
      .maybeSingle();

    if (error || !data) {
      setErrorMsg('اسم المستخدم أو كلمة السر غير صحيحة');
      setLoading(false);
      return;
    }

    // حفظ الجلسة محلياً وتسجيل الدخول
    localStorage.setItem('quantum_user', JSON.stringify(data));
    onLoginSuccess(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-quantum-darker flex justify-center items-center p-4 font-sans dir-rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 space-y-6 animate-fadeIn">
        
        <div className="text-center space-y-2">
          <div className="bg-quantum-bg p-4 rounded-2xl inline-block shadow-inner mb-2">
            <img src={quantumLogo} alt="Quantum Logo" className="h-10 object-contain mx-auto" />
          </div>
          <h2 className="text-2xl font-black text-quantum-dark">تسجيل الدخول للنظام</h2>
          <p className="text-xs text-gray-400">مرحباً بك، يرجى إدخال اسم المستخدم وكلمة السر</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3.5 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                required
                placeholder="أدخل اسم المستخدم (مثال: lina)..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-quantum-bg rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-quantum-red font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">كلمة السر</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-3 text-gray-400" size={18} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-quantum-bg rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-quantum-red"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-quantum-red text-white py-3.5 rounded-xl font-bold hover:bg-opacity-90 transition shadow-md flex justify-center items-center gap-2 text-sm mt-2"
          >
            <LogIn size={18} />
            {loading ? 'جاري التحقق...' : 'دخول للنظام ⚡'}
          </button>
        </form>
      </div>
    </div>
  );
}