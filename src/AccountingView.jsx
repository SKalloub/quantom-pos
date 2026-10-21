import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { TrendingUp, DollarSign, Calendar, Layers, ArrowUpRight, ShoppingBag, MinusCircle, Wallet } from 'lucide-react';

export default function AccountingView({ products }) {
  const [sales, setSales] = useState([]);
  const [cashWithdrawals, setCashWithdrawals] = useState([]);
  
  // نموذج سحب الكاش
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // 1. جلب المبيعات مع تفاصيل المنتجات والأسماء
    const { data: salesData } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          quantity,
          unit_price,
          products (name)
        )
      `)
      .order('created_at', { ascending: false });

    // 2. جلب عمليات سحب الكاش
    const { data: withdrawData } = await supabase
      .from('cash_withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    setSales(salesData || []);
    setCashWithdrawals(withdrawData || []);
  }

  // حسابات إحصائيات الشهر واليوم
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthSales = sales.filter(s => {
    const d = new Date(s.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const todaySales = sales.filter(s => {
    const d = new Date(s.created_at);
    return d.toDateString() === now.toDateString();
  });

  const totalMonthRevenue = monthSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalTodayRevenue = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  // إجمالي المبالغ المسحوبة من الكاش
  const totalWithdrawnCash = cashWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  // صافي الكاش المتوفر حالياً بالدرج (مبيعات اليوم - المسحوبات) أو إجمالي المبيعات ككل
  const netCashInDrawer = totalTodayRevenue - totalWithdrawnCash;

  // تنفيذ عملية سحب كاش
  const handleWithdrawCash = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للسحب');
      return;
    }

    setLoadingWithdraw(true);
    const { error } = await supabase.from('cash_withdrawals').insert([{
      amount: amount,
      reason: withdrawReason.trim() || 'سحب نقدي من الدرج'
    }]);

    if (!error) {
      alert('تم سحب المبلغ من الكاش بنجاح ⚡');
      setWithdrawAmount('');
      setWithdrawReason('');
      fetchData();
    } else {
      alert('حدث خطأ أثناء تسجيل عملية السحب');
    }
    setLoadingWithdraw(false);
  };

  // إجمالي قيمة المخزون الحالي
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* 1. Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">مبيعات الشهر الحالي</p>
            <h3 className="text-2xl font-black text-quantum-dark">₪{totalMonthRevenue.toFixed(2)}</h3>
            <span className="text-[11px] text-green-600 font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight size={12} /> {monthSales.length} فاتورة
            </span>
          </div>
          <div className="bg-red-50 p-3 rounded-2xl text-quantum-red">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">مبيعات اليوم الإجمالية</p>
            <h3 className="text-2xl font-black text-quantum-red">₪{totalTodayRevenue.toFixed(2)}</h3>
            <span className="text-[11px] text-gray-400 font-medium block mt-1">
              {todaySales.length} عمليات بيع اليوم
            </span>
          </div>
          <div className="bg-gray-100 p-3 rounded-2xl text-quantum-dark">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">صافي الكاش بالدرج</p>
            <h3 className="text-2xl font-black text-quantum-dark">₪{netCashInDrawer.toFixed(2)}</h3>
            <span className="text-[11px] text-gray-400 font-medium block mt-1">
              بعد خصم المسحوبات
            </span>
          </div>
          <div className="bg-gray-100 p-3 rounded-2xl text-gray-600">
            <Wallet size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">قيمة البضاعة بالمخزن</p>
            <h3 className="text-2xl font-black text-quantum-dark">₪{totalInventoryValue.toFixed(2)}</h3>
            <span className="text-[11px] text-gray-500 font-bold block mt-1">
              {products.length} منتج مسجل
            </span>
          </div>
          <div className="bg-red-50 p-3 rounded-2xl text-quantum-red">
            <Layers size={24} />
          </div>
        </div>
      </div>

      {/* 2. قسم إدارة وسحب الكاش (Cash Management) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-md font-bold text-quantum-dark mb-4 flex items-center gap-2 border-b pb-3">
            <MinusCircle className="text-quantum-red" size={18} />
            سحب نقدية من الكاش (مصاريف/درج)
          </h2>
          <form onSubmit={handleWithdrawCash} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">مبلغ السحب (₪)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                placeholder="0.00"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full p-2.5 bg-quantum-bg rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-quantum-red"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">سبب السحب / البيان</label>
              <input 
                type="text" 
                placeholder="مثال: شراء ضيافة / مصروف محل..."
                value={withdrawReason}
                onChange={e => setWithdrawReason(e.target.value)}
                className="w-full p-2.5 bg-quantum-bg rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-quantum-red"
              />
            </div>
            <button 
              type="submit" 
              disabled={loadingWithdraw}
              className="w-full bg-quantum-dark text-white py-3 rounded-xl font-bold text-xs hover:bg-quantum-red transition shadow-sm"
            >
              {loadingWithdraw ? 'جاري التنفيذ...' : 'تسجيل سحب نقدي ⚡'}
            </button>
          </form>
        </div>

        {/* سجل عمليات السحب السابقة */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-md font-bold text-quantum-dark mb-4 flex items-center gap-2 border-b pb-3">
            <Wallet className="text-quantum-red" size={18} />
            سجل سحوبات الكاش النقدية
          </h2>
          <div className="max-h-60 overflow-y-auto">
            {cashWithdrawals.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">لا توجد عمليات سحب مسجلة حتى الآن</p>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-quantum-bg text-gray-700 font-bold sticky top-0">
                  <tr className="border-b">
                    <th className="py-2.5 px-3">السبب / البيان</th>
                    <th className="py-2.5 px-3">التاريخ والوقت</th>
                    <th className="py-2.5 px-3 text-left">المبلغ المسحوب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cashWithdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{w.reason}</td>
                      <td className="py-2.5 px-3 text-gray-500">{new Date(w.created_at).toLocaleString('ar-EG')}</td>
                      <td className="py-2.5 px-3 text-left font-bold text-red-600">-₪{w.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 3. تقرير مبيعات اليوم وتفاصيل ما تم بيعه بالتفصيل */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-quantum-dark mb-4 flex items-center gap-2 border-b pb-3">
          <ShoppingBag className="text-quantum-red" size={20} />
          تقرير مبيعات اليوم بالتفصيل ({todaySales.length} فواتير اليوم)
        </h2>

        <div className="overflow-x-auto">
          {todaySales.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">لم يتم تسجيل أي مبيعات اليوم بعد</p>
          ) : (
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-quantum-bg text-gray-700 font-bold border-b">
                  <th className="py-3 px-4">رقم الفاتورة</th>
                  <th className="py-3 px-4">اسم العميل</th>
                  <th className="py-3 px-4">المنتجات المباعة والكميات</th>
                  <th className="py-3 px-4">وقت البيع</th>
                  <th className="py-3 px-4 text-left">إجمالي الفاتورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todaySales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-quantum-dark">#{sale.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">{sale.customer_name || 'زبون نقدي'}</td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {sale.sale_items?.map((item, idx) => (
                          <div key={idx} className="text-gray-600 bg-quantum-bg px-2 py-1 rounded-md inline-block ml-1">
                            <span className="font-bold text-quantum-dark">{item.products?.name}</span> (×{item.quantity})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{new Date(sale.created_at).toLocaleTimeString('ar-EG')}</td>
                    <td className="py-3.5 px-4 text-left font-black text-quantum-red text-sm">₪{sale.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}