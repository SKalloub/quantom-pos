import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Trash2, Search, CheckCircle, X, Printer, Tag, Sparkles, Receipt, Check, Truck, CreditCard, ScanBarcode } from 'lucide-react';
import { supabase } from './supabase';

export default function POSView({ products, fetchProducts, onPrintInvoice, currentUser }) {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // الخصم النهائي الإجمالي
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState('fixed');

  // خيارات الدفع والتوصيل
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });

  const [completedSale, setCompletedSale] = useState(null);

  const searchInputRef = useRef(null);

  // Focus تلقائي على خانة البحث أول ما تفتح الصفحة
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

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

  // 🎯 معالجة إدخال الباركود عبر مفتاح Enter تلقائياً
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchQuery.trim();
      if (!code) return;

      // البحث عن المنتج برقم الباركود المطابق تماماً
      const matchedProduct = products.find(p => p.barcode === code);

      if (matchedProduct) {
        addToCart(matchedProduct);
        setSearchQuery(''); // تفريغ الخانة للمسحة القادمة
      } else {
        // إذا لم يكن باركود دقيق، نكتفي بالتصفية العادية
      }
    }
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

  const calculateGlobalDiscountAmount = () => {
    if (globalDiscountType === 'fixed') {
      return Math.max(0, globalDiscountValue);
    } else {
      return Math.max(0, (subTotal * Math.min(100, globalDiscountValue)) / 100);
    }
  };

  const totalDiscountAmount = calculateGlobalDiscountAmount();
  const deliveryAmount = includeDelivery ? Math.max(0, parseFloat(deliveryFee) || 0) : 0;
  const totalAmount = Math.max(0, subTotal - totalDiscountAmount + deliveryAmount);

  const executeCheckout = async (withPrint, customerData = {}) => {
    if (cart.length === 0) return;
    setLoading(true);

    const salePayload = {
      total_amount: totalAmount,
      payment_method: paymentMethod,
      delivery_fee: deliveryAmount,
      customer_name: customerData.name || 'زبون نقدي',
      customer_phone: customerData.phone || 'غير متوفر',
      customer_email: customerData.email || 'غير متوفر',
      cashier_name: currentUser?.name || 'غير محدد'
    };

    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert([salePayload])
      .select()
      .single();

    if (saleErr) {
      console.error('Supabase Sale Error:', saleErr);
      alert('خطأ في إتمام الدفع: ' + (saleErr.message || 'تأكد من تحديث جدول قاعدة البيانات'));
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
      if (productInDb) {
        await supabase
          .from('products')
          .update({ stock: productInDb.stock - item.qty })
          .eq('id', item.id);
      }
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
      deliveryFee: deliveryAmount,
      paymentMethod,
      totalAmount,
      customer: salePayload,
      itemCount: cart.reduce((a, b) => a + b.qty, 0)
    };

    if (withPrint) {
      onPrintInvoice(currentSaleInfo);
    }

    setCompletedSale(currentSaleInfo);

    setCart([]);
    setGlobalDiscountValue(0);
    setGlobalDiscountType('fixed');
    setPaymentMethod('cash');
    setIncludeDelivery(false);
    setDeliveryFee(0);
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
      {completedSale && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 text-center relative overflow-hidden border border-emerald-100 animate-fadeIn">
            
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-quantum-red/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="bg-gradient-to-tr from-emerald-600 to-teal-400 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Check size={42} className="stroke-[3]" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-quantum-dark mb-1 flex items-center justify-center gap-1.5">
              تمت عملية البيع بنجاح! <Sparkles className="text-amber-400 fill-amber-400" size={20} />
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-medium">تم تسجيل الفاتورة وتحديث المخزون في النظام</p>

            <div className="bg-quantum-bg p-4 rounded-2xl border border-gray-100 space-y-2.5 text-xs text-right mb-6">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500">رقم الفاتورة:</span>
                <span className="font-mono font-bold text-quantum-dark">#{completedSale.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500">الكاشير المسؤول:</span>
                <span className="font-bold text-quantum-dark">{completedSale.customer.cashier_name}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500">طريقة الدفع:</span>
                <span className="font-bold text-quantum-dark">
                  {completedSale.paymentMethod === 'cash' ? '💵 كاش' : completedSale.paymentMethod === 'visa' ? '💳 فيزا' : '🔄 أخرى / تسهيلات'}
                </span>
              </div>
              {completedSale.deliveryFee > 0 && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-500">قيمة التوصيل:</span>
                  <span className="font-bold text-quantum-dark">₪{completedSale.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-gray-700">المبلغ المدفوع:</span>
                <span className="text-lg font-black text-emerald-600">₪{completedSale.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setCompletedSale(null);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="w-full bg-quantum-dark text-white py-3.5 rounded-2xl font-bold hover:bg-quantum-red transition shadow-lg text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              متابعة عملية بيع جديدة
            </button>
          </div>
        </div>
      )}

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
          
          {/* خانة البحث والمسح العالي السرعة */}
          <div className="relative mb-4">
            <Search className="absolute right-3.5 top-3.5 text-gray-400" size={20} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="امسح الباركود مباشرة بالماسح أو ابحث باسم المنتج..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pr-11 pl-28 py-3 bg-quantum-bg rounded-xl border border-gray-200 focus:outline-none focus:border-quantum-red transition text-sm font-semibold"
            />
            <span className="absolute left-3 top-2.5 bg-quantum-red/10 text-quantum-red px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              <ScanBarcode size={14} /> جاهز للمسح
            </span>
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

            <div className="overflow-y-auto max-h-[220px] space-y-3 pr-1">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">السلة فارغة، اختر المنتجات أو امسح الباركود للبدء</p>
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

          <div className="border-t pt-3 mt-1 space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>المجموع الفرعي:</span>
              <span>₪{subTotal.toFixed(2)}</span>
            </div>

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

            <div className="flex justify-between items-center text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <CreditCard size={13} className="text-quantum-red" /> طريقة الدفع:
              </span>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="p-1 bg-quantum-bg border rounded-lg text-xs font-bold text-quantum-dark focus:outline-none focus:border-quantum-red"
              >
                <option value="cash">💵 كاش (نقدًا)</option>
                <option value="visa">💳 فيزا (بطاقة)</option>
                <option value="other">🔄 أخرى / تسهيلات</option>
              </select>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs">
                <label className="flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeDelivery}
                    onChange={(e) => setIncludeDelivery(e.target.checked)}
                    className="rounded border-gray-300 text-quantum-red focus:ring-quantum-red"
                  />
                  <Truck size={14} className="text-quantum-red" /> إضافة توصيل
                </label>
                {includeDelivery && (
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      placeholder="قيمة التوصيل"
                      value={deliveryFee || ''}
                      onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      className="w-20 p-1 bg-quantum-bg border rounded-lg text-center text-xs font-bold text-quantum-red focus:outline-none focus:border-quantum-red"
                    />
                    <span className="text-[11px] text-gray-500">₪</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>الإجمالي النهائي:</span>
              <span className="text-quantum-red">₪{totalAmount.toFixed(2)}</span>
            </div>
            
            <button 
              disabled={cart.length === 0 || loading}
              onClick={() => setShowCheckoutModal(true)}
              className="w-full bg-quantum-red text-white py-2.5 rounded-xl font-bold hover:bg-opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm text-sm"
            >
              <CheckCircle size={16} />
              إتمام الدفع والطباعة
            </button>
          </div>
        </div>
      </div>
    </>
  );
}