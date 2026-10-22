import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { ShoppingCart, Receipt, Package, BarChart3, Calendar, UserCheck, Users, LogOut } from 'lucide-react';
import quantumLogo from './assets/quantum.svg';
import InvoiceTemplate from './InvoiceTemplate';
import ProductManagement from './ProductManagement';
import SalesHistory from './SalesHistory';
import POSView from './POSView';
import AccountingView from './AccountingView';
import UserManagement from './UserManagement';
import Login from './Login';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'products', 'sales', 'accounting', 'users'
  const [products, setProducts] = useState([]);
  const [lastSaleData, setLastSaleData] = useState(null);

  useEffect(() => {
    // فحص إذا كان هناك مستخدم مسجل دخوله سابقاً
    const savedUser = localStorage.getItem('quantum_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Error fetching products:', error);
    else setProducts(data || []);
  }

  const handleLogout = () => {
    localStorage.removeItem('quantum_user');
    setCurrentUser(null);
    setActiveTab('pos');
  };

  const handlePrint = (saleData) => {
    setLastSaleData(saleData);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  const todayFormatted = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // إذا لم يكن هناك مستخدم مسجل، نعرض شاشة تسجيل الدخول
  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-quantum-bg text-quantum-dark flex flex-col font-sans relative">
      
      {/* قالب الفاتورة المخصص للطباعة ورقة A4 كاملة */}
      <InvoiceTemplate saleData={lastSaleData} />

      {/* Header الرئيسي للموقع */}
      <header className="bg-quantum-darker text-white px-6 py-4 flex justify-between items-center shadow-md print:hidden">
        <div className="flex items-center gap-4">
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm flex items-center justify-center">
            <img src={quantumLogo} alt="Quantum Logo" className="h-7 object-contain" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-gray-200 text-xs font-bold">نظام نقاط البيع الذكي</span>
            <span className="text-quantum-red text-[11px] font-medium flex items-center gap-1 mt-0.5">
              <Calendar size={12} /> {todayFormatted}
            </span>
          </div>
        </div>

        {/* أزرار التنقل بين الشاشات */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-xs ${activeTab === 'pos' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
          >
            <ShoppingCart size={15} /> الكاشير
          </button>
          
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-xs ${activeTab === 'products' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
          >
            <Package size={15} /> المخزون
          </button>

          <button 
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-xs ${activeTab === 'sales' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
          >
            <Receipt size={15} /> المبيعات
          </button>

          <button 
            onClick={() => setActiveTab('accounting')}
            className={`px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-xs ${activeTab === 'accounting' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
          >
            <BarChart3 size={15} /> المحاسبة
          </button>

          {/* شاشة إدارة المستخدمين تظهر فقط للأدمن */}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-xs ${activeTab === 'users' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
            >
              <Users size={15} /> المستخدمين
            </button>
          )}

          {/* معلومات الموظف وزر الخروج */}
          <div className="mr-2 border-r border-gray-700 pr-3 flex items-center gap-2">
            <span className="text-xs bg-gray-800 px-2.5 py-1 rounded-lg text-gray-200 flex items-center gap-1 font-semibold">
              <UserCheck size={13} className="text-quantum-red" />
              {currentUser.name}
            </span>
            <button 
              onClick={handleLogout}
              className="bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white p-2 rounded-lg transition"
              title="تسجيل الخروج"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="flex-1 p-6 print:hidden">
        {activeTab === 'pos' && (
          <POSView 
            products={products} 
            fetchProducts={fetchProducts} 
            onPrintInvoice={handlePrint}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagement 
            products={products} 
            fetchProducts={fetchProducts} 
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistory 
            onPrintInvoice={handlePrint} 
          />
        )}

        {activeTab === 'accounting' && (
          <AccountingView 
            products={products} 
            currentUser={currentUser}
          />
        )}

        {activeTab === 'users' && isAdmin && (
          <UserManagement />
        )}
      </main>
    </div>
  );
}