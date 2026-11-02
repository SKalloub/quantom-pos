import React from 'react';
import quantumLogo from './assets/quantum.svg';
import { Download, Printer } from 'lucide-react';

export default function InvoiceTemplate({ saleData }) {
  if (!saleData) return null;

  // تحويل طريقة الدفع لنص عربي مرتب
  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'visa':
        return 'بطاقة ائتمان / فيزا (Visa Card)';
      case 'other':
        return 'تسهيلات / أخرى (Other)';
      case 'cash':
      default:
        return 'نقدي (Cash)';
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div>
      {/* شريط أزرار التحكم - يظهر فقط في الشاشة ولا يظهر أثناء الطباعة/الحفظ كـ PDF */}
      <div className="print:hidden fixed bottom-6 left-6 z-50 flex gap-3 bg-quantum-dark p-3 rounded-2xl shadow-2xl border border-gray-700">
        <button
          onClick={handleDownloadPDF}
          className="bg-quantum-red text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-opacity-90 transition flex items-center gap-2 shadow-md"
        >
          <Download size={16} />
          تحميل الإيصال PDF 📄
        </button>
        <button
          onClick={() => window.print()}
          className="bg-white text-quantum-dark px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 transition flex items-center gap-2 shadow-md"
        >
          <Printer size={16} />
          طباعة
        </button>
      </div>

      {/* قالب الإيصال المستهدف للطباعة والـ PDF */}
      <div className="hidden print:block bg-white text-gray-800 p-10 w-full max-w-[800px] mx-auto font-sans text-right dir-rtl" dir="rtl">
        
        {/* 1. Header الإيصال */}
        <div className="bg-quantum-dark text-white p-6 rounded-2xl flex justify-between items-center mb-6 shadow-sm border-r-8 border-quantum-red">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-xl flex items-center justify-center shadow-md">
              <img src={quantumLogo} alt="Quantum Logo" className="h-12 object-contain" />
            </div>
          </div>
          
          <div className="text-left dir-ltr">
            <span className="bg-quantum-red text-white text-xs font-black px-3.5 py-1.5 rounded-md uppercase tracking-wider block mb-1">
              RECEIPT / إيصال مبيعات
            </span>
            <h2 className="text-sm font-mono font-bold text-gray-200">
              #{saleData.id ? saleData.id.slice(0, 8).toUpperCase() : '000000'}
            </h2>
            <p className="text-[11px] text-gray-300 mt-0.5">{saleData.date}</p>
          </div>
        </div>

        {/* 2. تفاصيل المتجر والزبون */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          
          {/* معلومات المتجر */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-1 text-xs">
            <h3 className="font-extrabold text-quantum-red text-xs border-b border-gray-200 pb-1.5 mb-2 flex justify-between">
              <span>بيانات المتجر</span>
              <span className="text-[10px] text-gray-400 font-normal">STORE DETAILS</span>
            </h3>
            <p className="font-bold text-quantum-dark">QUANTUM</p>
            <p className="text-gray-600">رام الله، البالوع، بلازا مول - الطابق الثاني</p>
            <p className="text-gray-600 font-mono">هاتف: 0097056655775</p>
          </div>

          {/* معلومات العميل */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-1 text-xs">
            <h3 className="font-extrabold text-quantum-red text-xs border-b border-gray-200 pb-1.5 mb-2 flex justify-between">
              <span>بيانات العميل</span>
              <span className="text-[10px] text-gray-400 font-normal">CUSTOMER DETAILS</span>
            </h3>
            <p className="font-bold text-quantum-dark">الاسم: {saleData.customer?.customer_name || saleData.customer_name || 'زبون نقدي'}</p>
            <p className="text-gray-600">الهاتف: {saleData.customer?.customer_phone || saleData.customer_phone || 'غير متوفر'}</p>
            <p className="text-gray-600">البريد: {saleData.customer?.customer_email || saleData.customer_email || 'غير متوفر'}</p>
            <p className="text-gray-600">طريقة الدفع: <span className="font-bold text-quantum-dark">{formatPaymentMethod(saleData.paymentMethod || saleData.customer?.payment_method)}</span></p>
          </div>

        </div>

        {/* 3. جدول المنتجات والخدمات */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-quantum-dark text-white text-xs font-bold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">تفاصيل المنتج / الخدمة</th>
                <th className="py-3 px-4 text-center">السعر الفردي</th>
                <th className="py-3 px-4 text-center">الكمية</th>
                <th className="py-3 px-4 text-left">المجموع الصافي</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-200">
              {saleData.items && saleData.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="py-3 px-4 text-center font-mono font-bold text-gray-400">{index + 1}</td>
                  <td className="py-3 px-4 font-bold text-quantum-dark">{item.name}</td>
                  <td className="py-3 px-4 text-center font-mono text-gray-600">₪{item.price ? item.price.toFixed(2) : '0.00'}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-800">{item.qty}</td>
                  <td className="py-3 px-4 text-left font-mono font-black text-quantum-dark">
                    ₪{(item.finalTotal ? item.finalTotal : item.price * item.qty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. ملخص الحسابات وتفاصيل الكفالة */}
        <div className="grid grid-cols-2 gap-6 items-start mb-6">
          
          {/* ملاحظات الشروط والكفالة */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 text-xs space-y-2">
            <h4 className="font-bold text-quantum-dark border-b pb-1">ملاحظات وشروط الإيصال:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 text-[11px]">
              <li className="font-bold text-quantum-dark">يشمل هذا الإيصال كفالة المنتج المعلن عنها.</li>
              <li>تم الدفع بواسطة: <span className="font-bold text-gray-700">{formatPaymentMethod(saleData.paymentMethod || saleData.customer?.payment_method)}</span></li>
            </ul>
          </div>

          {/* المجموع والخصم والتوصيل والإجمالي */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي:</span>
              <span className="font-mono font-bold">₪{saleData.subTotal ? saleData.subTotal.toFixed(2) : saleData.totalAmount.toFixed(2)}</span>
            </div>

            {saleData.discount > 0 && (
              <div className="flex justify-between text-quantum-red font-semibold">
                <span>قيمة الخصم:</span>
                <span className="font-mono font-bold">-₪{saleData.discount.toFixed(2)}</span>
              </div>
            )}

            {saleData.deliveryFee > 0 && (
              <div className="flex justify-between text-blue-600 font-semibold">
                <span>رسوم التوصيل:</span>
                <span className="font-mono font-bold">+₪{saleData.deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t-2 border-quantum-red pt-2 mt-2 flex justify-between items-center text-sm font-black text-quantum-dark bg-red-50 p-2.5 rounded-lg">
              <span>المبلغ الإجمالي النهائي:</span>
              <span className="text-base text-quantum-red font-mono">₪{saleData.totalAmount.toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* 5. قسم ملاحظات أخرى */}
        <div className="bg-gray-50/60 p-4 rounded-xl border border-dashed border-gray-300 min-h-[90px] mb-8">
          <h4 className="font-bold text-gray-700 text-xs mb-2">ملاحظات أخرى:</h4>
        </div>

        {/* 6. الفوتر النهائي */}
        <div className="flex justify-between items-center text-[11px] text-gray-400 mt-6 pt-4 border-t border-gray-100 font-medium">
          <span>شكراً لتعاملكم معنا!</span>
          <span className="font-mono font-bold text-quantum-red">www.quantum.ps</span>
        </div>

      </div>
    </div>
  );
}