import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { ShoppingCart, Receipt, Package, BarChart3 } from 'lucide-react';
import quantumLogo from './assets/quantum.svg';
import InvoiceTemplate from './InvoiceTemplate';
import ProductManagement from './ProductManagement';
import SalesHistory from './SalesHistory';
import POSView from './POSView';
import AccountingView from './AccountingView';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'products', 'sales', 'accounting'
  const [products, setProducts] = useState([]);
  const [lastSaleData, setLastSaleData] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Error fetching products:', error);
    else setProducts(data || []);
  }

  const handlePrint = (saleData) => {
    setLastSaleData(saleData);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  return (
    <div className="min-h-screen bg-quantum-bg text-quantum-dark flex flex-col font-sans relative">
      
      {/* قالب الفاتورة المخصص للطباعة ورقة A4 كاملة */}
      <InvoiceTemplate saleData={lastSaleData} />

      {/* Header الرئيسي للموقع */}
      <header className="bg-quantum-darker text-white px-6 py-4 flex justify-between items-center shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm flex items-center justify-center">
            <img src={quantumLogo} alt="Quantum Logo" className="h-7 object-contain" />
          </div>
          <span className="text-gray-400 text-sm hidden sm:inline">نظام نقاط البيع الذكي</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-sm ${activeTab === 'pos' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
          >
            <ShoppingCart size={16} /> شاشة الكاشير
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-sm ${activeTab === 'products' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
          >
            <Package size={16} /> إدارة المخزون
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-sm ${activeTab === 'sales' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
          >
            <Receipt size={16} /> سجل المبيعات
          </button>
          <button 
            onClick={() => setActiveTab('accounting')}
            className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 text-sm ${activeTab === 'accounting' ? 'bg-quantum-red text-white shadow-md' : 'bg-quantum-gray text-gray-200 hover:bg-opacity-80'}`}
          >
            <BarChart3 size={16} /> المحاسبة والإحصائيات
          </button>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="flex-1 p-6 print:hidden">
        {activeTab === 'pos' && (
          <POSView 
            products={products} 
            fetchProducts={fetchProducts} 
            onPrintInvoice={handlePrint} 
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
          />
        )}
      </main>
    </div>
  );
}