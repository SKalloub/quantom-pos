import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Receipt, Search, Printer, X, Eye, User, Phone, Mail, Calendar, DollarSign, Trash2 } from 'lucide-react';

export default function SalesHistory({ onPrintInvoice }) {
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  
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

    if (error) console.error('Error fetching sales:', error);
    else setSales(data || []);
  }

  // حذف فاتورة من السجل
  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟')) return;

    // حذف عناصر الفاتورة المرتبطة أولاً (Cascade) ثم الفاتورة نفسها
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

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.customer_phone && s.customer_phone.includes(searchQuery))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* مودال عرض تفاصيل الفاتورة */}
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
                  {selectedSale.customer_name || 'زبون نقدي'}
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

      {/* مودال إدخال بيانات الزبون للطباعة */}
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

      {/* جدول المبيعات */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 border-b pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-quantum-dark">
            <Receipt className="text-quantum-red" />
            سجل حركة المبيعات بالفواتير
          </h2>

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

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-quantum-bg text-gray-700 text-xs font-bold border-b">
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">اسم العميل</th>
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4 text-center">الإجمالي (₪)</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-quantum-dark">#{sale.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-800">{sale.customer_name || 'زبون نقدي'}</td>
                  <td className="py-3.5 px-4 text-xs text-gray-500">{new Date(sale.created_at).toLocaleString('ar-EG')}</td>
                  <td className="py-3.5 px-4 text-center font-black text-quantum-red">₪{sale.total_amount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-center flex justify-center gap-2">
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
      </div>
    </div>
  );
}