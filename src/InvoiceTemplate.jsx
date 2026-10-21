import React from 'react';
import quantumLogo from './assets/quantum.svg';

export default function InvoiceTemplate({ saleData }) {
  if (!saleData) return null;

  return (
    <div className="hidden print:block bg-white text-gray-800 p-8 w-full max-w-[800px] mx-auto font-sans direction-rtl text-right" dir="rtl">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b-2 border-[#E52328] pb-6 mb-6">
        <div className="flex items-center gap-3">
          <img src={quantumLogo} alt="Quantum Logo" className="h-12 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">QUANTUM STORE</h1>
            <p className="text-xs text-gray-500">نظام نقاط البيع الذكي</p>
          </div>
        </div>
        <div className="text-left">
          <h2 className="text-3xl font-extrabold text-[#E52328] tracking-wider">فاتورة / INVOICE</h2>
          <div className="mt-2 inline-block bg-[#E52328] text-white px-4 py-1 rounded-lg text-sm font-bold">
            رقم الفاتورة: #{saleData.id.slice(0, 6)}
          </div>
          <p className="text-xs text-gray-500 mt-1">التاريخ: {saleData.date}</p>
        </div>
      </div>

      {/* Customer & Store Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div>
          <h3 className="text-xs font-bold text-[#E52328] uppercase tracking-wide mb-2">معلومات المتجر:</h3>
          <p className="text-xs text-gray-700">فلسطين - رام الله</p>
          <p className="text-xs text-gray-700">هاتف: +001234567890</p>
          <p className="text-xs text-gray-700">إيميل: info@quantumpos.com</p>
        </div>
        <div>
          <h3 className="text-xs font-bold text-[#E52328] uppercase tracking-wide mb-2">معلومات العميل:</h3>
          <p className="text-xs text-gray-900 font-bold">اسم العميل: {saleData.customer.customer_name}</p>
          <p className="text-xs text-gray-700">رقم الهاتف: {saleData.customer.customer_phone}</p>
          <p className="text-xs text-gray-700">البريد الإلكتروني: {saleData.customer.customer_email}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-[#2B2B2B] text-white text-xs">
            <th className="py-2.5 px-3 text-right rounded-r-lg">#</th>
            <th className="py-2.5 px-3 text-right">تفاصيل المنتج / الخدمة</th>
            <th className="py-2.5 px-3 text-center">السعر</th>
            <th className="py-2.5 px-3 text-center">الكمية</th>
            <th className="py-2.5 px-3 text-left rounded-l-lg">الإجمالي</th>
          </tr>
        </thead>
        <tbody className="text-xs divide-y divide-gray-200">
          {saleData.items.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="py-3 px-3 font-bold text-gray-600">{index + 1}</td>
              <td className="py-3 px-3 font-semibold text-gray-800">{item.name}</td>
              <td className="py-3 px-3 text-center text-gray-600">${item.price.toFixed(2)}</td>
              <td className="py-3 px-3 text-center text-gray-600">{item.qty}</td>
              <td className="py-3 px-3 text-left font-bold text-[#E52328]">${(item.price * item.qty).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary & Bank Details */}
      <div className="grid grid-cols-2 gap-8 items-start mb-8 border-t border-gray-200 pt-6">
        <div className="space-y-2 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h4 className="font-bold text-[#E52328] mb-1">تفاصيل الدفع والبنوك:</h4>
          <p className="text-gray-600">طريقة الدفع: نقدي (Cash)</p>
          <p className="text-gray-600">بنك فلسطين - حساب رقم: 543-8976-4432-02</p>
          <p className="text-gray-600">موعد الدفع: فوري عند الاستلام</p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 text-gray-600">
            <span>المجموع الفرعي:</span>
            <span>${saleData.subTotal.toFixed(2)}</span>
          </div>
          {saleData.discount > 0 && (
            <div className="flex justify-between py-1 text-red-600">
              <span>الخصم:</span>
              <span>-${saleData.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-[#E52328] text-base font-extrabold text-gray-900 bg-red-50 px-3 rounded-lg">
            <span>المبلغ الإجمالي:</span>
            <span className="text-[#E52328]">${saleData.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer & Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200 text-xs mt-12">
        <div className="text-center">
          <p className="mb-12 font-bold text-gray-700">توقيع المستلم / العميل</p>
          <div className="border-b border-gray-400 w-48 mx-auto"></div>
        </div>
        <div className="text-center">
          <p className="mb-12 font-bold text-gray-700">ختم وتوقيع المتجر (QUANTUM)</p>
          <div className="border-b border-gray-400 w-48 mx-auto"></div>
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-400 mt-12 pt-4 border-t border-gray-100">
        شكراً لتعاملكم معنا - تم إنشاء هذه الفاتورة إلكترونياً بواسطة نظام QUANTUM POS ⚡
      </div>
    </div>
  );
}