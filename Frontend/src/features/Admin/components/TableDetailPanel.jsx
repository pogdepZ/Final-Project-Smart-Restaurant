import React, { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code"; // Thư viện QR Code Frontend
import {
  X, Printer, Image as ImageIcon, FileText,
  RefreshCw, Users, MapPin, Calendar, Activity
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import axiosClient from "../../../store/axiosClient";

const TableDetailPanel = ({ table: initialTable, onClose, onRefresh }) => {
  const [table, setTable] = useState(initialTable);
  const qrRef = useRef(null); // Ref để chụp ảnh QR cho PNG/PDF

  useEffect(() => {
    setTable(initialTable);
  }, [initialTable]);

  if (!table) return null;

  // URL mà khách hàng sẽ quét
  const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?token=${table.qr_token}`;

  const tokenDate = new Date(table.created_at).toLocaleDateString("vi-VN", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // --- HÀM XỬ LÝ (Handlers) ---

  // 1. Tải PNG (Chụp từ Component)
  const handleDownloadPNG = async () => {
    if (!qrRef.current) return;
    try {
        const canvas = await html2canvas(qrRef.current, { scale: 3 }); // Scale cao để nét
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `QR_${table.table_number}.png`;
        link.click();
        toast.success("Đã tải ảnh PNG");
    } catch (err) {
        toast.error("Lỗi tải ảnh");
    }
  };

  // 2. Tải PDF (Chụp từ Component -> PDF)
  const handleDownloadPDF = async () => {
    if (!qrRef.current) return;
    try {
        const canvas = await html2canvas(qrRef.current, { scale: 3 });
        const imgData = canvas.toDataURL("image/png");
        
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        
        // Căn giữa ảnh vào PDF
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`QR_${table.table_number}.pdf`);
        toast.success("Đã tải PDF");
    } catch (err) {
        toast.error("Lỗi tạo PDF");
    }
  };

  // 3. In (Mở cửa sổ mới)
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=800');
    // Lấy SVG string từ react-qr-code
    const svg = document.getElementById("qr-svg-container").innerHTML;

    printWindow.document.write(`
      <html>
        <head>
            <title>In Mã QR - ${table.table_number}</title>
            <style>
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { border: 2px solid #000; padding: 40px; border-radius: 20px; text-align: center; width: 300px; }
                h1 { margin: 0 0 10px; font-size: 48px; }
                p { font-size: 18px; margin: 5px 0; }
                .qr-box { margin: 20px 0; }
            </style>
        </head>
        <body>
          <div class="card">
            <h1>${table.table_number}</h1>
            <p>${table.location}</p>
            <div class="qr-box">${svg}</div>
            <p style="font-weight: bold; text-transform: uppercase; margin-top: 20px;">Quét Để Gọi Món</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 4. Làm mới Token
  const handleRegenerate = async () => {
    if (!window.confirm("CẢNH BÁO: Mã cũ sẽ bị vô hiệu hóa. Tiếp tục?")) return;
    try {
        const res = await axiosClient.post(`/admin/tables/${table.id}/regenerate`);
        toast.success("Mã QR đã được làm mới!");
        setTable(prev => ({ ...prev, qr_token: res.qr_token })); // Update state
        if (onRefresh) onRefresh();
    } catch (err) {
        toast.error("Lỗi làm mới mã");
    }
  };

  return (
    <div className="w-full h-full bg-neutral-900 border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* --- TEMPLATE ẨN ĐỂ CHỤP ẢNH (Dùng cho PNG/PDF) --- */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
        <div ref={qrRef} style={{ width: '600px', padding: '40px', background: 'white', textAlign: 'center', fontFamily: 'Arial' }}>
            <h1 style={{ fontSize: '60px', fontWeight: 'bold', margin: '0' }}>{table.table_number}</h1>
            <p style={{ fontSize: '24px', color: '#555', margin: '10px 0 30px' }}>{table.location}</p>
            <QRCode value={clientUrl} size={400} />
            <p style={{ fontSize: '30px', fontWeight: 'bold', marginTop: '30px', textTransform: 'uppercase' }}>Scan to Order</p>
        </div>
      </div>

      {/* --- HEADER --- */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="text-lg font-bold text-white">Chi Tiết Bàn</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* --- BODY --- */}
      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
        <div className="text-center">
          
          {/* QR Code Preview (Dùng react-qr-code) */}
          <div className="inline-block bg-white p-4 rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
             <div id="qr-svg-container">
                <QRCode 
                    value={clientUrl} 
                    size={200} 
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                />
             </div>
          </div>

          <h2 className="text-4xl font-black text-white mb-2">{table.table_number}</h2>
          
          <div className="flex flex-col gap-3 mt-4 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400 flex gap-2"><Users size={16}/> Sức chứa:</span>
                <span className="text-white font-bold">{table.capacity} Khách</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-400 flex gap-2"><MapPin size={16}/> Vị trí:</span>
                <span className="text-white font-bold">{table.location}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
                <span className="text-gray-400 flex gap-2"><Calendar size={16}/> Ngày tạo:</span>
                <span className="text-white text-xs">{tokenDate}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-400 flex gap-2"><Activity size={16}/> Trạng thái:</span>
                <span className={`text-xs font-bold uppercase ${table.status==='active' ? 'text-green-400' : 'text-red-400'}`}>{table.status}</span>
            </div>
          </div>

          {table.description && (
            <div className="mt-4 text-left">
                <label className="text-xs font-bold text-gray-500 uppercase">Ghi chú</label>
                <p className="text-gray-300 text-sm italic mt-1 bg-black/20 p-3 rounded-lg border border-white/5">"{table.description}"</p>
            </div>
          )}
        </div>
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="p-6 border-t border-white/10 bg-black/20 space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <button onClick={handleDownloadPNG} className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10">
              <ImageIcon size={16} /> PNG
            </button>
            <button onClick={handleDownloadPDF} className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10">
              <FileText size={16} /> PDF
            </button>
        </div>
        <button onClick={handlePrint} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20">
            <Printer size={18} /> In Ngay
        </button>
        <button onClick={handleRegenerate} className="w-full py-2.5 text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
            <RefreshCw size={14} /> Làm Mới Mã QR
        </button>
      </div>
    </div>
  );
};

export default TableDetailPanel;