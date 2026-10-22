import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { Package, Plus, Save, Edit3, Trash2, ScanBarcode } from 'lucide-react';

export default function ProductManagement({ products, fetchProducts }) {
  const [newProduct, setNewProduct] = useState({ barcode: '', name: '', price: '', stock: '' });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ price: '', stock: '' });

  const barcodeInputRef = useRef(null);

  // التركيز التلقائي على خانة الباركود للسرعة الخارقة في الإدخال
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const productData = {
      barcode: newProduct.barcode.trim(),
      name: newProduct.name.trim(),
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock, 10)
    };

    const { error } = await supabase.from('products').insert([productData]);
    
    if (!error) {
      alert('تمت إضافة المنتج بنجاح للقاعدة ⚡');
      setNewProduct({ barcode: '', name: '', price: '', stock: '' });
      fetchProducts();
      // إعادة التركيز التلقائي على خانة الباركود ليمسح المنتج التالي مباشرة
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    } else {
      alert('خطأ أثناء الإضافة، تأكد أن الباركود فريد وغير مكرر');
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditValues({ price: product.price, stock: product.stock });
  };

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from('products')
      .update({
        price: parseFloat(editValues.price),
        stock: parseInt(editValues.stock, 10)
      })
      .eq('id', id);

    if (!error) {
      alert('تم تحديث بيانات المنتج بنجاح ⚡');
      setEditingId(null);
      fetchProducts();
    } else {
      alert('حدث خطأ أثناء تعديل المنتج');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من المستودع؟')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (!error) {
      alert('تم حذف المنتج بنجاح ⚡');
      fetchProducts();
    } else {
      alert('خطأ: لا يمكن حذف منتج مرتبط بفواتير مبيعات سابقة');
    }
  };

  return (
    <div className="space-y-8">
      {/* إضافة منتج جديد */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-quantum-dark">
            <Plus className="text-quantum-red" />
            إضافة منتج جديد للمستودع
          </h2>
          <span className="text-xs bg-quantum-bg text-quantum-red font-bold px-3 py-1 rounded-xl flex items-center gap-1 border">
            <ScanBarcode size={15} /> جاهز لمسح الباركود
          </span>
        </div>

        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">باركود المنتج</label>
              <input 
                ref={barcodeInputRef}
                type="text" 
                required
                placeholder="امسح الباركود بالماسح الضوئي..."
                value={newProduct.barcode}
                onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                className="w-full p-3 bg-quantum-bg rounded-xl border border-gray-200 focus:outline-none focus:border-quantum-red text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">اسم المنتج</label>
              <input 
                type="text" 
                required
                placeholder="مثال: Logitech G77 Mouse / Razer Dock..."
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full p-3 bg-quantum-bg rounded-xl border border-gray-200 focus:outline-none focus:border-quantum-red text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">السعر (₪)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                placeholder="0.00"
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                className="w-full p-3 bg-quantum-bg rounded-xl border border-gray-200 focus:outline-none focus:border-quantum-red text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الكمية المتوفرة بالمخزن</label>
              <input 
                type="number" 
                required
                placeholder="0"
                value={newProduct.stock}
                onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                className="w-full p-3 bg-quantum-bg rounded-xl border border-gray-200 focus:outline-none focus:border-quantum-red text-sm"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full bg-quantum-dark text-white py-3.5 rounded-xl font-bold hover:bg-quantum-red transition shadow-sm mt-4 text-sm"
          >
            حفظ المنتج في قاعدة البيانات ⚡
          </button>
        </form>
      </div>

      {/* جدول إدارة المخزون */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-3 text-quantum-dark">
          <Package className="text-quantum-red" />
          إدارة وتعديل المخزون الحالي ({products.length} منتج)
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-quantum-bg text-gray-700 text-xs font-bold border-b">
                <th className="py-3 px-4">الباركود</th>
                <th className="py-3 px-4">اسم المنتج</th>
                <th className="py-3 px-4 text-center">السعر (₪)</th>
                <th className="py-3 px-4 text-center">المخزون المتوفر</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{product.barcode}</td>
                  <td className="py-3 px-4 font-bold text-quantum-dark">{product.name}</td>
                  
                  <td className="py-3 px-4 text-center">
                    {editingId === product.id ? (
                      <input 
                        type="number" 
                        step="0.01"
                        value={editValues.price}
                        onChange={e => setEditValues({...editValues, price: e.target.value})}
                        className="w-20 p-1 border rounded text-center text-sm focus:border-quantum-red"
                      />
                    ) : (
                      <span className="font-bold text-quantum-red">₪{product.price}</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {editingId === product.id ? (
                      <input 
                        type="number" 
                        value={editValues.stock}
                        onChange={e => setEditValues({...editValues, stock: e.target.value})}
                        className="w-20 p-1 border rounded text-center text-sm focus:border-quantum-red"
                      />
                    ) : (
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {product.stock} قطع
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center flex justify-center gap-1.5">
                    {editingId === product.id ? (
                      <button 
                        onClick={() => saveEdit(product.id)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1 shadow-sm"
                      >
                        <Save size={14} /> حفظ
                      </button>
                    ) : (
                      <button 
                        onClick={() => startEdit(product)}
                        className="bg-quantum-bg text-quantum-dark border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-quantum-red hover:text-quantum-red flex items-center gap-1 transition"
                      >
                        <Edit3 size={14} /> تعديل
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100 transition"
                      title="حذف المنتج"
                    >
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