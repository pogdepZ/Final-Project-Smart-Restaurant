import React from "react";
import { X, Printer, Download, MapPin, Users, Calendar } from "lucide-react";

const TableDetailModal = ({ table, onClose }) => {
  if (!table) return null;

  // Tính toán URL QR Code
  const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?token=${table.qr_token}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    clientUrl
  )}`;

  const tokenDate = new Date(table.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDownload = async () => {
    try {
      const response = await fetch(qrSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_Ban_${table.table_number}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      alert("Lỗi tải ảnh");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=600");
    printWindow.document.write(`
      <html>
        <head><title>QR ${table.table_number}</title></head>
        <body style="text-align:center; padding: 50px;">
          <h1>${table.table_number}</h1>
          <img src="${qrSrc}" style="width:300px"/>
          <script>window.onload=()=>{window.print();window.close();}</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/20 p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8 text-center">
          <div className="inline-block bg-white p-4 rounded-2xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <img
              src={qrSrc}
              alt="QR Code"
              className="w-64 h-64 object-contain"
            />
          </div>

          <h2 className="text-3xl font-black text-white mb-2">
            {table.table_number}
          </h2>
          <div className="flex justify-center gap-4 text-gray-400 text-sm mb-6">
            <span className="flex items-center gap-1">
              <Users size={16} className="text-orange-500" /> {table.capacity}{" "}
              Khách
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={16} className="text-orange-500" /> {table.location}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Calendar size={14} /> Ngày tạo mã:
            </span>
            <span className="text-white text-xs">{tokenDate}</span>
          </div>

          {table.description && (
            <p className="text-gray-500 italic mb-8 border-t border-white/5 pt-4">
              "{table.description}"
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleDownload}
              className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/5"
            >
              <Download size={20} /> Tải Ảnh
            </button>
            <button
              onClick={handlePrint}
              className="py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20"
            >
              <Printer size={20} /> In Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableDetailModal;
