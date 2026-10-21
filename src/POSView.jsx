import React, { useState } from 'react';
import { ShoppingCart, Trash2, Search, CheckCircle, X, Printer, Tag } from 'lucide-react';
import { supabase } from './supabase';

export default function POSView({ products, fetchProducts, onPrintInvoice }) {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // الخصم النهائي الإجمالي
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState('fixed'); // 'fixed' or 'percent'

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('هذا المنتج نفذ من المخزون!');
      return;
    }
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert('الكمية المطلوبة تتجاوز المتاح في المخزن');
          return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1, discountValue: 0, discountType: 'fixed' }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        const prod = products.find(p => p.id === id);
        if (newQty > prod.stock) {
          alert('عذراً، الكمية غير متوفرة بالمخزن');
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const updateItemDiscount = (id, value, type) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, discountValue: Math.max(0, parseFloat(value) || 0), discountType: type };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // حساب السعر النهائي لكل منتج بعد خصمه الخاص
  const calculateItemFinalPrice = (item) => {
    const baseTotal = item.price * item.qty;
    if (item.discountType === 'fixed') {
      return Math.max(0, baseTotal - item.discountValue);
    } else {
      const discountAmount = (baseTotal * Math.min(100, item.discountValue)) / 100;
      return Math.max(0, baseTotal - discountAmount);
    }
  };

  const subTotal = cart.reduce((sum, item) => sum + calculateItemFinalPrice(item), 0);

  // حساب الخصم الإجمالي النهائي (مبلغ أو نسبة)
  const calculateGlobalDiscountAmount = () => {
    if (globalDiscountType === 'fixed') {
      return Math.max(0, globalDiscountValue);
    } else {
      return Math.max(0, (subTotal * Math.min(100, globalDiscountValue)) / 100);
    }
  };

  const totalDiscountAmount = calculateGlobalDiscountAmount();
  const totalAmount = Math.max(0, subTotal - totalDiscountAmount);

  const executeCheckout = async (withPrint, customerData = {}) => {
    if (cart.length === 0) return;
    setLoading(true);

    const salePayload = {
      total_amount: totalAmount,
      payment_method: 'cash',
      customer_name: customerData.name || 'زبون نقدي',
      customer_phone: customerData.phone || 'غير متوفر',
      customer_email: customerData.email || 'غير متوفر'
    };

    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert([salePayload])
      .select()
      .single();

    if (saleErr) {
      alert('خطأ في إتمام الدفع');
      setLoading(false);
      return;
    }

    for (const item of cart) {
      const finalItemPrice = calculateItemFinalPrice(item) / item.qty;
      await supabase.from('sale_items').insert([{
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.qty,
        unit_price: finalItemPrice
      }]);

      const productInDb = products.find(p => p.id === item.id);
      await supabase
        .from('products')
        .update({ stock: productInDb.stock - item.qty })
        .eq('id', item.id);
    }

    const currentSaleInfo = {
      id: sale.id,
      date: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG'),
      items: cart.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        finalTotal: calculateItemFinalPrice(item)
      })),
      subTotal,
      discount: totalDiscountAmount,
      totalAmount,
      customer: salePayload
    };

    alert('تمت عملية البيع بنجاح ⚡');

    if (withPrint) {
      onPrintInvoice(currentSaleInfo);
    }

    setCart([]);
    setGlobalDiscountValue(0);
    setGlobalDiscountType('fixed');
    setShowCheckoutModal(false);
    setCheckoutMode(null);
    setCustomerInfo({ name: '', phone: '', email: '' });
    fetchProducts();
    setLoading(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode.includes(searchQuery)
  );

  return (
    <>
      {/* مودال خيارات الدفع والطباعة */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-quantum-dark">
                <CheckCircle className="text-quantum-red" size={22} />
                خيارات إتمام الدفع
              </h3>
              <button onClick={() => { setShowCheckoutModal(false); setCheckoutMode(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {!checkoutMode ? (
              <div className="space-y-3 py-4">
                <button 
                  onClick={() => executeCheckout(false)}
                  className="w-full bg-quantum-dark text-white py-3.5 rounded-xl font-bold hover:bg-quantum-red transition shadow-sm"
                >
                  إتمام الدفع دون طباعة فاتورة 🚫
                </button>
                <button 
                  onClick={() => setCheckoutMode('print')}
                  className="w-full bg-quantum-red text-white py-3.5 rounded-xl font-bold hover:bg-opacity-90 transition shadow-sm flex justify-center items-center gap-2"
                >
                  <Printer size={18} />
                  إتمام الدفع مع طباعة فاتورة 🖨️
                </button>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <p className="text-sm text-gray-500">الرجاء إدخال بيانات الزبون للفاتورة:</p>
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
                  <button onClick={() => setCheckoutMode(null)} className="w-1/2 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm">رجوع</button>
                  <button disabled={loading} onClick={() => executeCheckout(true, customerInfo)} className="w-1/2 bg-quantum-red text-white py-3 rounded-xl font-bold text-sm">
                    {loading ? 'جاري التنفيذ...' : 'تأكيد وطباعة'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* واجهة الكاشير */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-130px)]">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-5 flex flex-col border border-gray-100">
          <div className="relative mb-4">
            <Search className="absolute right-3.5 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="ابحث باسم المنتج أو امسح الباركود هنا..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 bg-quantum-bg rounded-xl border border-gray-200 focus:outline-none focus:border-quantum-red transition text-sm"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-1">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className={`bg-quantum-bg border p-4 rounded-xl cursor-pointer transition flex flex-col justify-between ${product.stock > 0 ? 'hover:border-quantum-red hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
              >
                <div>
                  <h3 className="font-bold text-quantum-dark mb-1 text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-500">باركود: {product.barcode}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-quantum-red font-bold text-base">₪{product.price}</span>
                  <span className={`text-xs px-2 py-1 rounded-md ${product.stock > 0 ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-600'}`}>
                    {product.stock > 0 ? `متوفر: ${product.stock}` : 'خلص المخزون'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* سلة المشتريات */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col justify-between border border-gray-100">
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-3">
              <ShoppingCart size={20} className="text-quantum-red" />
              سلة المشتريات الحالية
            </h2>

            <div className="overflow-y-auto max-h-[300px] space-y-3 pr-1">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">السلة فارغة، اختر المنتجات للبدء</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-quantum-bg p-3 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-xs text-quantum-dark">{item.name}</h4>
                        <span className="text-xs text-quantum-red font-bold">₪{item.price} × {item.qty}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white rounded-md shadow-sm font-bold border hover:bg-gray-50">-</button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-white rounded-md shadow-sm font-bold border hover:bg-gray-50">+</button>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 mr-1"><Trash2 size={15} /></button>
                      </div>
                    </div>

                    {/* قسم خصم المنتج الواحد */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60 text-[11px]">
                      <span className="flex items-center gap-1 text-gray-500 font-medium">
                        <Tag size={12} className="text-quantum-red" /> خصم:
                      </span>
                      <input 
                        type="number" 
                        placeholder="القيمة"
                        value={item.discountValue || ''}
                        onChange={(e) => updateItemDiscount(item.id, e.target.value, item.discountType)}
                        className="w-16 p-1 bg-white border rounded text-center focus:outline-none focus:border-quantum-red"
                      />
                      <select 
                        value={item.discountType}
                        onChange={(e) => updateItemDiscount(item.id, item.discountValue, e.target.value)}
                        className="p-1 bg-white border rounded text-xs focus:outline-none focus:border-quantum-red"
                      >
                        <option value="fixed">₪ شيكل</option>
                        <option value="percent">% نسبة</option>
                      </select>
                      <span className="mr-auto font-bold text-quantum-dark">
                        = ₪{calculateItemFinalPrice(item).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-4 mt-2 space-y-2.5">
            <div className="flex justify-between text-xs text-gray-600">
              <span>المجموع الفرعي:</span>
              <span>₪{subTotal.toFixed(2)}</span>
            </div>

            {/* خصم إجمالي إضافي (مبلغ أو نسبة مئوية) */}
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>خصم إجمالي إضافي:</span>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  placeholder="0"
                  value={globalDiscountValue || ''} 
                  onChange={(e) => setGlobalDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-16 p-1 bg-quantum-bg border rounded-lg text-center text-xs focus:outline-none focus:border-quantum-red"
                />
                <select 
                  value={globalDiscountType}
                  onChange={(e) => setGlobalDiscountType(e.target.value)}
                  className="p-1 bg-quantum-bg border rounded-lg text-xs focus:outline-none focus:border-quantum-red font-medium"
                >
                  <option value="fixed">₪ شيكل</option>
                  <option value="percent">% نسبة</option>
                </select>
              </div>
            </div>

            {totalDiscountAmount > 0 && (
              <div className="flex justify-between text-xs text-quantum-red font-semibold">
                <span>قيمة الخصم النهائي:</span>
                <span>-₪{totalDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>الإجمالي النهائي:</span>
              <span className="text-quantum-red">₪{totalAmount.toFixed(2)}</span>
            </div>
            
            <button 
              disabled={cart.length === 0 || loading}
              onClick={() => setShowCheckoutModal(true)}
              className="w-full bg-quantum-red text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm text-sm"
            >
              <CheckCircle size={18} />
              إتمام الدفع والطباعة
            </button>
          </div>
        </div>
      </div>
    </>
  );
}