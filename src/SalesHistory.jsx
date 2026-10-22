import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Receipt, Search, Printer, X, Eye, User, Phone, Mail, Calendar, DollarSign, Trash2, Filter, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';

export default function SalesHistory({ onPrintInvoice }) {
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  
  // الفلاتر
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'week', 'month'

  // الأيام المفتوحة في الأكورديون
  const [openDays, setOpenDays] = useState({});

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [targetSaleToPrint, setTargetSaleToPrint] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          id,
          quantity,
          unit_price,
          products (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
    } else {
      setSales(data || []);
      // فتح اليوم الأول تلقائياً في الأكورديون
      if (data && data.length > 0) {
        const firstDayKey = new Date(data[0].created_at).toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setOpenDays({ [firstDayKey]: true });
      }
    }
  }

  // حذف فاتورة من السجل
  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟')) return;

    await supabase.from('sale_items').delete().eq('sale_id', saleId);
    const { error } = await supabase.from('sales').delete().eq('id', saleId);

    if (!error) {
      alert('تم حذف الفاتورة بنجاح ⚡');
      fetchSales();
      setSelectedSale(null);
    } else {
      alert('خطأ أثناء محاولة حذف الفاتورة');
    }
  };

  const handlePrintClick = (sale) => {
    if (sale.customer_name && sale.customer_name !== 'زبون نقدي') {
      triggerPrint(sale, {
        customer_name: sale.customer_name,
        customer_phone: sale.customer_phone,
        customer_email: sale.customer_email
      });
    } else {
      setTargetSaleToPrint(sale);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setShowCustomerModal(true);
    }
  };

  const submitCustomerAndPrint = async () => {
    if (!targetSaleToPrint) return;

    await supabase
      .from('sales')
      .update({
        customer_name: customerInfo.name || 'زبون نقدي',
        customer_phone: customerInfo.phone || 'غير متوفر',
        customer_email: customerInfo.email || 'غير متوفر'
      })
      .eq('id', targetSaleToPrint.id);

    const updatedCustomer = {
      customer_name: customerInfo.name || 'زبون نقدي',
      customer_phone: customerInfo.phone || 'غير متوفر',
      customer_email: customerInfo.email || 'غير متوفر'
    };

    setShowCustomerModal(false);
    triggerPrint(targetSaleToPrint, updatedCustomer);
    fetchSales();
  };

  const triggerPrint = (sale, customerData) => {
    const formattedData = {
      id: sale.id,
      date: new Date(sale.created_at).toLocaleString('ar-EG'),
      items: sale.sale_items.map(item => ({
        name: item.products?.name || 'منتج',
        price: item.unit_price,
        qty: item.quantity
      })),
      subTotal: sale.total_amount,
      discount: 0,
      totalAmount: sale.total_amount,
      customer: customerData
    };

    onPrintInvoice(formattedData);
  };

  // جلب قائمة الكاشيرية المتوفرين في السجل
  const uniqueCashiers = Array.from(new Set(sales.map(s => s.cashier_name || 'غير محدد')));

  // تطبيق الفلاتر (البحث، الكاشير، والتاريخ)
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sale.customer_name && sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sale.customer_phone && sale.customer_phone.includes(searchQuery));

    const matchesCashier = selectedCashier === 'all' || (sale.cashier_name || 'غير محدد') === selectedCashier;

    // فلترة التاريخ
    const saleDate = new Date(sale.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = saleDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'yesterday') {
      matchesDate = saleDate.toDateString() === yesterday.toDateString();
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = saleDate >= sevenDaysAgo;
    } else if (dateFilter === 'month') {
      matchesDate = saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
    }

    return matchesSearch && matchesCashier && matchesDate;
  });

  // تجميع الفواتير المفلترة حسب اليوم لإنشاء الأكورديون المنسدل
  const groupedSales = filteredSales.reduce((groups, sale) => {
    const dayKey = new Date(sale.created_at).toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(sale);
    return groups;
  }, {});

  const toggleDayAccordion = (dayKey) => {
    setOpenDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* 1. مودال عرض تفاصيل الفاتورة */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="text-quantum-red" size={22} />
                <h3 className="text-lg font-bold text-quantum-dark">
                  تفاصيل الفاتورة #{selectedSale.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs bg-quantum-bg p-4 rounded-xl border border-gray-100">
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 font-bold text-quantum-dark">
                  <User size={14} className="text-quantum-red" />
                  الزبون: {selectedSale.customer_name || 'زبون نقدي'}
                </p>
                <p className="flex items-center gap-1.5 text-gray-500">
                  <Phone size={14} />
                  {selectedSale.customer_phone || 'غير متوفر'}
                </p>
                <p className="flex items-center gap-1.5 text-gray-500">
                  <Mail size={14} />
                  {selectedSale.customer_email || 'غير متوفر'}
                </p>
              </div>

              <div className="space-y-1.5 border-r border-gray-200 pr-3">
                <p className="flex items-center gap-1.5 font-bold text-quantum-dark">
                  <UserCheck size={14} className="text-quantum-red" />
                  الكاشير: {selectedSale.cashier_name || 'غير محدد'}
                </p>
                <p className="flex items-center gap-1.5 text-gray-600">
                  <Calendar size={14} className="text-quantum-red" />
                  {new Date(selectedSale.created_at).toLocaleString('ar-EG')}
                </p>
                <p className="flex items-center gap-1.5 text-gray-600">
                  <DollarSign size={14} />
                  طريقة الدفع: نقدي
                </p>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto mb-4 border rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-quantum-bg text-gray-700 font-bold sticky top-0">
                  <tr className="border-b">
                    <th className="py-2.5 px-3">المنتج</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-center">السعر</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSale.sale_items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-semibold text-quantum-dark">{item.products?.name || 'منتج'}</td>
                      <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center">₪{item.unit_price}</td>
                      <td className="py-2.5 px-3 text-left font-bold text-quantum-red">₪{(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center border-t pt-3">
              <div className="text-sm font-bold text-quantum-dark">
                المبلغ الإجمالي: <span className="text-xl font-black text-quantum-red">₪{selectedSale.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDeleteSale(selectedSale.id)}
                  className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 flex items-center gap-1"
                >
                  <Trash2 size={14} /> حذف الفاتورة
                </button>
                <button 
                  onClick={() => {
                    const saleToPrint = selectedSale;
                    setSelectedSale(null);
                    handlePrintClick(saleToPrint);
                  }}
                  className="bg-quantum-red text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-opacity-90 flex items-center gap-1.5 shadow-sm"
                >
                  <Printer size={15} /> طباعة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. مودال إدخال بيانات الزبون للطباعة */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-quantum-dark">طباعة فاتورة جديدة (إدخال بيانات العميل)</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 py-2">
              <p className="text-xs text-gray-500">هذا الطلب تم إتمامه سابقاً بدون فاتورة، أدخل بيانات العميل لطباعتها الآن:</p>
              <div>
                <label className="block text-xs font-medium mb-1">اسم الزبون</label>
                <input 
                  type="text" 
                  placeholder="اسم الزبون الكامل..." 
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full p-2.5 bg-quantum-bg rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-quantum-red"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">رقم الهاتف</label>
                <input 
                  type="text" 
                  placeholder="059xxxxxxx..." 
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full p-2.5 bg-quantum-bg rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-quantum-red"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  placeholder="email@example.com..." 
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full p-2.5 bg-quantum-bg rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-quantum-red"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCustomerModal(false)} className="w-1/2 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs">إلغاء</button>
                <button onClick={submitCustomerAndPrint} className="w-1/2 bg-quantum-red text-white py-2.5 rounded-xl font-bold text-xs shadow-sm">تأكيد وطباعة ⚡</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. شريط التحكم والفلاتر وقائمة المبيعات */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-6">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-quantum-dark">
              <Receipt className="text-quantum-red" />
              سجل حركة المبيعات بالفواتير
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">استعراض وتصفية المبيعات حسب الأيام والكاشيرية</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute right-3.5 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث برقم الفاتورة أو اسم العميل..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-quantum-bg rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-quantum-red"
            />
          </div>
        </div>

        {/* 🛠️ شريط الفلاتر الذكية (تاريخ + كاشير) */}
        <div className="flex flex-wrap items-center gap-3 bg-quantum-bg p-3.5 rounded-xl border border-gray-100 text-xs">
          <span className="font-bold text-quantum-dark flex items-center gap-1">
            <Filter size={14} className="text-quantum-red" /> الفلاتر:
          </span>

          {/* فلتر الكاشير */}
          <div className="flex items-center gap-1.5">
            <label className="text-gray-500 font-medium">الكاشير:</label>
            <select 
              value={selectedCashier}
              onChange={e => setSelectedCashier(e.target.value)}
              className="p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-quantum-red font-semibold text-xs"
            >
              <option value="all">كل الكاشيرية 👥</option>
              {uniqueCashiers.map((cashier, idx) => (
                <option key={idx} value={cashier}>{cashier}</option>
              ))}
            </select>
          </div>

          {/* فلتر الفترة الزمنية */}
          <div className="flex items-center gap-1.5">
            <label className="text-gray-500 font-medium">التاريخ:</label>
            <select 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-quantum-red font-semibold text-xs"
            >
              <option value="all">كل التواريخ 📅</option>
              <option value="today">اليوم</option>
              <option value="yesterday">الأمس</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">هذا الشهر</option>
            </select>
          </div>

          {/* عدد الفواتير الإجمالي المفلتر */}
          <span className="mr-auto font-bold text-quantum-dark bg-white px-3 py-1.5 rounded-lg border">
            المجموع: <span className="text-quantum-red font-black">{filteredSales.length}</span> فاتورة
          </span>
        </div>

        {/* 4. عرض الفواتير مجمعة ومقسمة حسب الأيام في أكورديون منسدل */}
        <div className="space-y-4">
          {Object.keys(groupedSales).length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              لا توجد فواتير مبيعات تطابق الفلاتر المحددة
            </div>
          ) : (
            Object.entries(groupedSales).map(([dayTitle, daySales]) => {
              const dayTotalRevenue = daySales.reduce((sum, s) => sum + s.total_amount, 0);
              const isOpen = openDays[dayTitle] ?? false;

              return (
                <div key={dayTitle} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* رأس القائمة المنسدلة (الأكورديون) لكل يوم */}
                  <div 
                    onClick={() => toggleDayAccordion(dayTitle)}
                    className="bg-quantum-dark text-white p-4 flex justify-between items-center cursor-pointer hover:bg-quantum-darker transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-quantum-red p-2 rounded-xl text-white">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{dayTitle}</h3>
                        <span className="text-[11px] text-gray-400">
                          {daySales.length} فواتير مسجلة في هذا اليوم
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <span className="text-[10px] text-gray-400 block">إجمالي مبيعات اليوم</span>
                        <span className="text-base font-black text-quantum-red">₪{dayTotalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="bg-white/10 p-1.5 rounded-lg text-gray-300">
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* جدول فواتير اليوم المغلق/المفتوح */}
                  {isOpen && (
                    <div className="overflow-x-auto bg-white p-2">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-quantum-bg text-gray-700 text-xs font-bold border-b">
                            <th className="py-3 px-4">رقم الفاتورة</th>
                            <th className="py-3 px-4">الزبون</th>
                            <th className="py-3 px-4">الكاشير المسئول</th>
                            <th className="py-3 px-4">وقت البيع</th>
                            <th className="py-3 px-4 text-center">الإجمالي (₪)</th>
                            <th className="py-3 px-4 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                          {daySales.map(sale => (
                            <tr key={sale.id} className="hover:bg-gray-50/70 transition">
                              <td className="py-3 px-4 font-mono text-xs font-bold text-quantum-dark">
                                #{sale.id.slice(0, 8).toUpperCase()}
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-800">
                                {sale.customer_name || 'زبون نقدي'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-quantum-red text-xs">
                                <span className="bg-red-50 text-quantum-red px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1">
                                  <UserCheck size={12} />
                                  {sale.cashier_name || 'غير محدد'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-gray-500">
                                {new Date(sale.created_at).toLocaleTimeString('ar-EG')}
                              </td>
                              <td className="py-3 px-4 text-center font-black text-quantum-red">
                                ₪{sale.total_amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-center flex justify-center gap-2">
                                <button onClick={() => setSelectedSale(sale)} className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition" title="عرض التفاصيل">
                                  <Eye size={16} />
                                </button>
                                <button onClick={() => handlePrintClick(sale)} className="bg-quantum-red text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-opacity-90 transition flex items-center gap-1.5 shadow-sm">
                                  <Printer size={14} /> طباعة
                                </button>
                                <button onClick={() => handleDeleteSale(sale.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition" title="حذف الفاتورة">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}