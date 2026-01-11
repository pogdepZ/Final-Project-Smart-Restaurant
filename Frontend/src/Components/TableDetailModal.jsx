import React from "react";
import {
  X,
  Printer,
  Download,
  MapPin,
  Users,
  Calendar,
  Activity,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRTemplate from "../Components/QRTemplate";

const TableDetailModal = ({ table, onClose }) => {
  if (!table) return null;

  // Tính toán URL QR Code
  const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?token=${table.qr_token}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    clientUrl
  )}`;
  const templateId = `qr-template-${table.id}`;

  const tokenDate = new Date(table.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Tải PNG
  const handleDownloadPNG = async () => {
    const element = document.getElementById(templateId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 }); // Scale 2 để nét hơn (High-res)
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `QR_${table.table_number}.png`;
      link.click();
    } catch (err) {
      alert("Lỗi tạo ảnh");
    }
  };

  // 2. Tải PDF
  const handleDownloadPDF = async () => {
    const element = document.getElementById(templateId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4"); // Khổ A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Căn giữa ảnh vào PDF
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`QR_${table.table_number}.pdf`);
    } catch (err) {
      alert("Lỗi tạo PDF");
    }
  };

  // 3. Hàm In Ngay (Print Preview cửa sổ mới)
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=800');
    printWindow.document.write(`
      <html>
        <head>
            <title>QR Code - ${table.table_number}</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .qr-card { text-align: center; border: 4px solid #000; padding: 40px; border-radius: 30px; width: 400px; }
                h1 { margin: 0 0 10px 0; font-size: 60px; font-weight: 800; }
                p.loc { font-size: 24px; margin: 0 0 30px 0; color: #555; }
                img { display: block; margin: 0 auto; width: 100%; height: auto; }
                p.scan { margin-top: 30px; font-weight: bold; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
            </style>
        </head>
        <body>
          <div class="qr-card">
            <h1>${table.table_number}</h1>
            <p class="loc">${table.location}</p>
            <!-- onload quan trọng để đợi ảnh tải xong mới in -->
            <img src="${qrSrc}" onload="setTimeout(function(){window.print();}, 500);" />
            <p class="scan">Quét để gọi món</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] animate-in fade-in duration-200">
      <QRTemplate id={templateId} table={table} qrSrc={qrSrc} />

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

          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={handleDownloadPNG}
              className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-white/5"
            >
              <ImageIcon size={18} /> Lưu PNG
            </button>
            <button
              onClick={handleDownloadPDF}
              className="py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
            >
              <FileText size={18} /> Lưu PDF
            </button>
            <button onClick={handlePrint} className="py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20">
              <Printer size={18} /> In Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableDetailModal;
