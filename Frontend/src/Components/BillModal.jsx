import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  X,
  Printer,
  CreditCard,
  Banknote,
  FileDown,
  QrCode,
  Wallet,
  Loader2,
  ExternalLink,
} from "lucide-react";
import QRCodeReact from "react-qr-code";
import { billApi } from "../services/billApi";
import { stripeApi } from "../services/stripeApi";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { formatMoneyVND } from "../utils/orders";

// Lazy load Stripe components - chỉ load khi cần thanh toán Stripe
const StripePaymentWrapper = lazy(() => import("./StripePaymentWrapper"));

// CẤU HÌNH TÀI KHOẢN NGÂN HÀNG
const BANK_INFO = {
  BANK_ID: import.meta.env.VITE_BANK_ID || "MB",
  ACCOUNT_NO: import.meta.env.VITE_ACCOUNT_NO || "21230907843010",
  TEMPLATE: import.meta.env.VITE_TEMPLATE || "compact",
  ACCOUNT_NAME: import.meta.env.VITE_ACCOUNT_NAME || "NHA HANG SMART",
};

// Stripe Promise - sẽ load khi cần (dynamic import)
let stripePromiseCache = null;
let loadStripeModule = null;

const getStripe = async () => {
  if (!stripePromiseCache) {
    try {
      // Dynamic import để không load Stripe SDK khi không cần
      if (!loadStripeModule) {
        const stripeJs = await import("@stripe/stripe-js");
        loadStripeModule = stripeJs.loadStripe;
      }
      const config = await stripeApi.getConfig();
      stripePromiseCache = loadStripeModule(config.publishableKey);
    } catch (err) {
      console.error("Failed to load Stripe config:", err);
    }
  }
  return stripePromiseCache;
};

const BillModal = ({ tableId, tableName, onClose, onPaymentSuccess }) => {
  const [billData, setBillData] = useState(null);
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(true);
  const [qrBankUrl, setQrBankUrl] = useState("");

  // Stripe states
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Stripe QR states
  const [stripePaymentUrl, setStripePaymentUrl] = useState("");
  const [stripeSessionId, setStripeSessionId] = useState("");
  const [showStripeQR, setShowStripeQR] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // 1. Fetch Bill Preview
  useEffect(() => {
    if (!tableId) return;
    const fetchBill = async () => {
      setCalculating(true);
      try {
        const res = await billApi.previewBill(tableId, {
          discount_type: discountType,
          discount_value: Number(discountValue),
        });
        setBillData(res);
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi tải hóa đơn");
        onClose();
      } finally {
        setCalculating(false);
      }
    };
    const timeoutId = setTimeout(fetchBill, 500);
    return () => clearTimeout(timeoutId);
  }, [tableId, discountType, discountValue]);

  // 2. Tạo QR Chuyển khoản
  useEffect(() => {
    if (billData && billData.final_amount > 0) {
      const amount = Math.ceil(billData.final_amount);
      const description = `TT BAN ${tableName}`;
      const url = `https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${
        BANK_INFO.ACCOUNT_NO
      }-${BANK_INFO.TEMPLATE}.png?amount=${amount}&addInfo=${encodeURIComponent(
        description,
      )}&accountName=${encodeURIComponent(BANK_INFO.ACCOUNT_NAME)}`;
      setQrBankUrl(url);
    }
  }, [billData, tableName]);

  // 3. Hàm Tạo PDF (Đã tối ưu giao diện & sửa lỗi font)
  // 3. Hàm Tạo PDF (Đã thêm cột Đơn giá)
  const generateReceiptPDF = () => {
    if (!billData) return null;

    // CẤU HÌNH KHỔ GIẤY K80
    const PAPER_WIDTH = 80;
    const MARGIN = 4;

    // --- CẤU HÌNH CỘT MỚI (Đã căn chỉnh lại) ---
    // SL: Căn phải tại 48mm
    // Đơn giá: Căn phải tại 63mm
    // Thành tiền: Căn phải tại 77mm (Sát lề phải)
    const COL_QTY_X = 48;
    const COL_PRICE_UNIT_X = 63;
    const COL_PRICE_X = 77;

    // Helper: Xử lý tiếng Việt không dấu
    const removeAccents = (str) => {
      return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    };

    // Helper: Format tiền riêng cho PDF (Chỉ số)
    const formatCurrencyPDF = (amount) => {
      if (amount === undefined || amount === null) return "0";
      return new Intl.NumberFormat("vi-VN").format(amount);
    };

    // --- TÍNH TOÁN CHIỀU CAO TRANG ---
    const docTest = new jsPDF({ unit: "mm", format: [PAPER_WIDTH, 2000] });
    docTest.setFont("helvetica", "normal");
    docTest.setFontSize(9);

    let itemsHeight = 0;
    billData.items.forEach((item) => {
      // Giảm chiều rộng tên món xuống còn 35mm để chừa chỗ cho các cột số liệu
      const nameLines = docTest.splitTextToSize(removeAccents(item.name), 35);
      itemsHeight += nameLines.length * 4.5;
      if (item.modifiers && item.modifiers.length > 0)
        itemsHeight += item.modifiers.length * 3.5;
      if (item.note) itemsHeight += 4;
      itemsHeight += 2;
    });

    const headerHeight = 45;
    const footerHeight = 45;
    const pageHeight = headerHeight + itemsHeight + footerHeight;

    // --- KHỞI TẠO DOC ---
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [PAPER_WIDTH, pageHeight < 60 ? 60 : pageHeight],
    });

    let y = 8;

    // HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SMART RESTAURANT", PAPER_WIDTH / 2, y, { align: "center" });
    y += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("123 Duong ABC, Quan 1, TP.HCM", PAPER_WIDTH / 2, y, {
      align: "center",
    });
    y += 4;
    doc.text("Hotline: 0909.123.456", PAPER_WIDTH / 2, y, { align: "center" });
    y += 7;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PHIEU THANH TOAN", PAPER_WIDTH / 2, y, { align: "center" });
    y += 6;

    // INFO
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Ban: ${removeAccents(tableName)}`, MARGIN, y);
    y += 4;
    doc.text(`Ngay: ${new Date().toLocaleString("en-GB")}`, MARGIN, y);
    y += 4;

    // Phương thức thanh toán
    const paymentMethodText = {
      cash: "Tien mat",
      card: "The",
      transfer: "Chuyen khoan",
      stripe: "Stripe",
    };
    doc.text(
      `PT Thanh toan: ${paymentMethodText[paymentMethod] || "Tien mat"}`,
      MARGIN,
      y,
    );
    y += 4;

    // Thông tin session (nếu có)
    if (billData.session_started_at) {
      const startTime = new Date(
        billData.session_started_at,
      ).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      doc.text(`Gio vao: ${startTime}`, MARGIN, y);
      y += 4;
    }

    if (billData.session_ended_at) {
      const endTime = new Date(billData.session_ended_at).toLocaleTimeString(
        "en-GB",
        { hour: "2-digit", minute: "2-digit" },
      );
      doc.text(`Gio ra: ${endTime}`, MARGIN, y);
      y += 4;
    }

    doc.setLineDash([1, 1], 0);
    doc.line(MARGIN, y, PAPER_WIDTH - MARGIN, y);
    doc.setLineDash([]);
    y += 5;

    // TITLE COLUMNS (Đã thêm Đ.Gia)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8); // Giảm font tiêu đề chút cho đỡ chật
    doc.text("Ten mon", MARGIN, y);
    doc.text("SL", COL_QTY_X, y, { align: "right" });
    doc.text("DGia", COL_PRICE_UNIT_X, y, { align: "right" }); // Cột mới
    doc.text("TTien", COL_PRICE_X, y, { align: "right" });
    y += 5;

    // ITEMS LIST
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    billData.items.forEach((item) => {
      // Tên món (Wrap text với độ rộng 35mm)
      const name = removeAccents(item.name);
      const nameLines = doc.splitTextToSize(name, 35);

      doc.text(nameLines, MARGIN, y);

      // IN CÁC CỘT SỐ LIỆU (SL - Đơn Giá - Thành Tiền)
      // Tính đơn giá (nếu API không trả về price gốc thì lấy subtotal / qty)
      const unitPrice = item.price_base
        ? item.price_base
        : item.subtotal / item.qty;

      doc.text(String(item.qty), COL_QTY_X, y, { align: "right" });
      doc.text(formatCurrencyPDF(unitPrice), COL_PRICE_UNIT_X, y, {
        align: "right",
      }); // In Đơn giá
      doc.text(formatCurrencyPDF(item.subtotal), COL_PRICE_X, y, {
        align: "right",
      });

      y += nameLines.length * 4.5;

      // Topping
      // 2. In Modifiers (Topping) kèm giá
      if (item.modifiers && item.modifiers.length > 0) {
        doc.setFontSize(8); // Font nhỏ hơn cho topping
        doc.setTextColor(80); // Màu xám đậm

        item.modifiers.forEach((mod) => {
          // Tên Topping
          const modName = `+ ${removeAccents(mod.name)}`;
          const modLines = doc.splitTextToSize(modName, 35); // Wrap text nếu tên dài

          doc.text(modLines, MARGIN + 2, y); // Thụt đầu dòng 2mm

          // Giá Topping (In vào cột Đơn giá)
          const modPrice = Number(mod.price);
          if (modPrice > 0) {
            doc.text(`+${formatCurrencyPDF(modPrice)}`, COL_PRICE_UNIT_X, y, {
              align: "right",
            });
          }

          y += modLines.length * 3.5; // Tăng y theo số dòng topping
        });

        doc.setTextColor(0); // Reset màu đen
        doc.setFontSize(9); // Reset font size
      }
      // 3. In Note (Nếu có)
      if (item.note) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        const noteText = `Note: ${removeAccents(item.note)}`;
        const noteLines = doc.splitTextToSize(noteText, 35);
        doc.text(noteLines, MARGIN + 2, y);
        y += noteLines.length * 3.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }

      y += 1.5; // Khoảng cách giữa các món
    });

    // DIVIDER
    y += 1;
    doc.setLineDash([1, 1], 0);
    doc.line(MARGIN, y, PAPER_WIDTH - MARGIN, y);
    doc.setLineDash([]);
    y += 5;

    // TOTALS
    const drawRow = (label, value, isBold = false, fontSize = 9) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      doc.text(label, MARGIN + 10, y); // Lùi label vào ít hơn chút để đẹp

      const displayValue =
        typeof value === "number" ? formatCurrencyPDF(value) : value;
      doc.text(displayValue, COL_PRICE_X, y, { align: "right" });
      y += 5;
    };

    drawRow("Tam tinh:", billData.subtotal);
    if (billData.discount_amount > 0) {
      drawRow("Giam gia:", `-${formatCurrencyPDF(billData.discount_amount)}`);
    }
    drawRow("VAT (10%):", billData.tax_amount);

    y += 2;
    drawRow("TONG CONG:", billData.final_amount, true, 14);

    // FOOTER
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Cam on quy khach & Hen gap lai!", PAPER_WIDTH / 2, y, {
      align: "center",
    });

    return doc;
  };

  // 4. Handlers
  const handlePrint = () => {
    const doc = generateReceiptPDF();
    if (doc) {
      // Dùng iframe để in trực tiếp, tránh lỗi scale nhỏ
      const blob = doc.output("bloburl");
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = blob;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(blob);
        }, 60000);
      };
    }
  };

  const handleDownload = () => {
    const doc = generateReceiptPDF();
    if (doc) {
      const fileName = `Bill_${tableName}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      toast.success("Đã tải hóa đơn về máy!");
    }
  };

  // Khởi tạo Stripe Payment Intent
  const handleInitStripe = async () => {
    if (!billData) return;

    setStripeLoading(true);
    try {
      // 1. Load Stripe
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Không thể kết nối Stripe");
      }
      setStripePromise(stripe);

      // 2. Tạo Payment Intent
      const result = await stripeApi.createPaymentIntent(tableId, {
        discount_type: discountType,
        discount_value: Number(discountValue),
      });

      if (result.clientSecret) {
        setClientSecret(result.clientSecret);
        setShowStripeForm(true);
      } else {
        throw new Error("Không thể tạo phiên thanh toán");
      }
    } catch (err) {
      console.error("Stripe init error:", err);
      toast.error(err.message || "Lỗi khởi tạo Stripe");
    } finally {
      setStripeLoading(false);
    }
  };

  // Tạo Stripe QR Code (Payment Link)
  const handleCreateStripeQR = async () => {
    if (!billData) return;

    setStripeLoading(true);
    try {
      const result = await stripeApi.createPaymentLink(tableId, {
        discount_type: discountType,
        discount_value: Number(discountValue),
      });

      if (result.url) {
        setStripePaymentUrl(result.url);
        setStripeSessionId(result.sessionId);
        setShowStripeQR(true);
        setPaymentStatus(null);
        toast.success("Đã tạo mã QR Stripe! Quét để thanh toán");
      } else {
        throw new Error("Không thể tạo link thanh toán");
      }
    } catch (err) {
      console.error("Stripe QR error:", err);
      toast.error(err.message || "Lỗi tạo QR Stripe");
    } finally {
      setStripeLoading(false);
    }
  };

  // Kiểm tra trạng thái thanh toán Stripe
  const handleCheckStripePayment = async () => {
    if (!stripeSessionId) return;

    setCheckingPayment(true);
    try {
      const result = await stripeApi.checkSessionStatus(stripeSessionId);

      if (result.status === "complete") {
        setPaymentStatus("complete");
        toast.success("Thanh toán thành công!");

        // Xử lý thanh toán thành công
        await billApi.checkoutBill(tableId, {
          payment_method: "stripe",
          discount_type: discountType,
          discount_value: Number(discountValue),
          stripe_session_id: stripeSessionId,
        });

        handlePrint();
        if (onPaymentSuccess) onPaymentSuccess();

        // Đóng modal sau khi xử lý xong
        setTimeout(() => {
          onClose();
        }, 1000);

        return true; // Trả về true để dừng polling
      } else if (result.status === "open") {
        setPaymentStatus("pending");
        return false; // Tiếp tục polling
      } else {
        setPaymentStatus("failed");
        toast.error("Thanh toán thất bại hoặc đã hủy");
        return true; // Dừng polling
      }
    } catch (err) {
      console.error("Check payment error:", err);
      toast.error("Lỗi kiểm tra thanh toán");
      return false;
    } finally {
      setCheckingPayment(false);
    }
  };

  // Auto-polling khi QR được hiển thị
  useEffect(() => {
    if (!showStripeQR || !stripeSessionId) return;

    let isActive = true;
    const interval = setInterval(async () => {
      if (!isActive) return;

      const shouldStop = await handleCheckStripePayment();
      if (shouldStop) {
        clearInterval(interval);
        isActive = false;
      }
    }, 5000); // Check mỗi 5 giây

    return () => {
      clearInterval(interval);
      isActive = false;
    };
  }, [showStripeQR, stripeSessionId]);

  const handleCheckout = async () => {
    if (!billData) return;
    if (
      !window.confirm(
        `Xác nhận thanh toán ${formatMoneyVND(billData.final_amount)}?`,
      )
    )
      return;

    setLoading(true);
    try {
      await billApi.checkoutBill(tableId, {
        payment_method: paymentMethod,
        discount_type: discountType,
        discount_value: Number(discountValue),
      });

      toast.success("Thanh toán thành công!");
      handlePrint();
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err) {
      toast.error("Lỗi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  if (!billData && calculating)
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center text-white">
        Đang tính tiền...
      </div>
    );
  if (!billData) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-white font-bold text-lg">
              Thanh Toán: {tableName}
            </h3>
            <p className="text-gray-400 text-xs">
              Vui lòng kiểm tra kỹ trước khi chốt bill
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          {/* List Items Summary - Redesigned */}
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Chi tiết đơn hàng
              </span>
              <span className="text-xs text-gray-500">
                {billData.items.length} món
              </span>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-inner">
              {billData.items.map((item, idx) => (
                <div
                  key={idx}
                  className="group p-4 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                >
                  {/* HÀNG TRÊN: Thông tin chính món ăn */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      {/* Badge Số lượng */}
                      <div className="  shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm">
                        {item.qty}
                      </div>

                      {/* Tên món & Đơn giá */}
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-200 leading-tight">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium mt-0.5">
                          Đơn giá: {formatMoneyVND(item.price_base)}
                        </span>
                      </div>
                    </div>

                    {/* Thành tiền (Tổng dòng) */}
                    <div className="text-sm font-bold text-white whitespace-nowrap">
                      {formatMoneyVND(item.subtotal)}
                    </div>
                  </div>

                  {/* HÀNG DƯỚI: Modifiers & Note */}
                  {(item.modifiers?.length > 0 || item.note) && (
                    <div className="mt-3 pl-11 space-y-2">
                      {/* List Modifiers */}
                      {item.modifiers?.length > 0 && (
                        <div className="space-y-1">
                          {item.modifiers.map((mod, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs text-gray-400 group/mod"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                                <span className="truncate">{mod.name}</span>
                              </div>
                              {/* Dòng kẻ nối mờ */}
                              <div className="flex-1 border-b border-dashed border-white/10 mx-2 relative top-px opacity-30"></div>
                              <span className="font-medium text-gray-300">
                                +{formatMoneyVND(mod.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Note riêng của món */}
                      {item.note && (
                        <div className="text-[11px] text-orange-400/90 italic bg-orange-500/5 px-2 py-1.5 rounded border border-orange-500/10 inline-block max-w-full truncate">
                          📝 {item.note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Payment Method Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discount */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">
                Giảm giá
              </label>
              {/* Thêm min-w-0 để tránh lỗi tràn layout trên grid */}
              <div className="flex gap-2 min-w-0">
                <select
                  className="bg-black/40 text-white border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none w-20 cursor-pointer"
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    setDiscountValue(0);
                  }}
                >
                  <option value="none">Không</option>
                  <option value="percent">%</option>
                  <option value="fixed">VNĐ</option>
                </select>
                <input
                  type="number"
                  className="flex-1 min-w-0 bg-black/40 text-white border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-500 transition-colors"
                  placeholder="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={discountType === "none"}
                />
              </div>
            </div>

            {/* Payment Method - Đã thêm background để cân đối với bên trái */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase block">
                Thanh toán bằng
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  {
                    id: "cash",
                    icon: <Banknote size={16} />,
                    label: "Tiền mặt",
                  },
                  { id: "card", icon: <CreditCard size={16} />, label: "Thẻ" },
                  { id: "transfer", icon: <QrCode size={16} />, label: "QR" },
                  { id: "stripe", icon: <Wallet size={16} />, label: "Stripe" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPaymentMethod(m.id);
                      setShowStripeForm(false);
                      setShowStripeQR(false);
                      setStripePaymentUrl("");
                    }}
                    className={`flex-1 min-w-15 flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      paymentMethod === m.id
                        ? "bg-orange-600 text-white border-orange-500"
                        : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {m.icon}
                    <span className="text-[10px] mt-1">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {paymentMethod === "transfer" && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                {qrBankUrl ? (
                  <img
                    src={qrBankUrl}
                    alt="QR Chuyển khoản"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-black">
                    Đang tạo QR...
                  </div>
                )}
              </div>
              <div className="mt-2 text-center space-y-1">
                <p className="text-gray-400 text-xs">Quét mã để thanh toán</p>
                <p className="text-orange-500 font-bold text-lg">
                  {formatMoneyVND(billData.final_amount)}
                </p>
                <p className="text-gray-500 text-xs font-mono">
                  ND: TT BAN {tableName}
                </p>
              </div>
            </div>
          )}

          {/* Stripe Checkout Section */}
          {paymentMethod === "stripe" && !showStripeForm && !showStripeQR && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 p-4 bg-white/5 rounded-xl border border-white/10">
              <Wallet size={48} className="text-purple-500 mb-3" />
              <h4 className="text-white font-bold mb-2">
                Thanh toán qua Stripe
              </h4>
              <p className="text-gray-400 text-sm text-center mb-4">
                Hỗ trợ Visa, Mastercard, Apple Pay, Google Pay
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCreateStripeQR}
                  disabled={stripeLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <QrCode size={18} />
                      QR Code
                    </>
                  )}
                </button>

                <button
                  onClick={handleInitStripe}
                  disabled={stripeLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Nhập thẻ
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Stripe QR Code Display */}
          {paymentMethod === "stripe" && showStripeQR && stripePaymentUrl && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 p-6 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl border border-purple-500/30">
              <h4 className="text-white font-bold mb-2 text-lg">
                🔒 Quét QR để thanh toán Stripe
              </h4>
              <p className="text-gray-300 text-sm text-center mb-4">
                Quét mã QR bằng điện thoại để mở trang thanh toán
              </p>

              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeReact
                  value={stripePaymentUrl}
                  size={200}
                  level="H"
                  fgColor="#000000"
                />
              </div>

              <div className="mt-4 text-center space-y-2">
                <p className="text-purple-400 font-bold text-xl">
                  {formatMoneyVND(billData.final_amount)}
                </p>
                {paymentStatus === "pending" && (
                  <p className="text-yellow-400 text-xs animate-pulse">
                    ⏳ Chờ khách thanh toán...
                  </p>
                )}
                {paymentStatus === "complete" && (
                  <p className="text-green-400 text-xs">
                    ✅ Đã thanh toán thành công!
                  </p>
                )}
                {!paymentStatus && (
                  <p className="text-gray-400 text-xs">
                    Thanh toán an toàn qua Stripe
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2 w-full">
                <button
                  onClick={() => window.open(stripePaymentUrl, "_blank")}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Mở link
                </button>
                <button
                  onClick={() => {
                    setShowStripeQR(false);
                    setStripePaymentUrl("");
                    setPaymentStatus(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                >
                  Hủy
                </button>
              </div>

              {/* Nút kiểm tra thủ công */}
              <button
                onClick={handleCheckStripePayment}
                disabled={checkingPayment}
                className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {checkingPayment ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Kiểm tra thanh toán
                  </>
                )}
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                💡 Hệ thống tự động kiểm tra mỗi 5 giây hoặc bấm "Kiểm tra thanh
                toán"
              </div>
            </div>
          )}

          {/* Stripe Payment Form */}
          {paymentMethod === "stripe" &&
            showStripeForm &&
            stripePromise &&
            clientSecret && (
              <div className="animate-in zoom-in-95 duration-300">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center p-8 text-orange-500">
                      <Loader2 className="animate-spin mr-2" size={24} />
                      <span>Đang tải form thanh toán...</span>
                    </div>
                  }
                >
                  <StripePaymentWrapper
                    stripePromise={stripePromise}
                    clientSecret={clientSecret}
                    amount={billData.final_amount}
                    tableId={tableId}
                    tableName={tableName}
                    onSuccess={(result) => {
                      if (onPaymentSuccess) onPaymentSuccess();
                      onClose();
                    }}
                    onCancel={() => {
                      setShowStripeForm(false);
                      setClientSecret("");
                    }}
                  />
                </Suspense>
              </div>
            )}

          {/* Totals */}
          <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tạm tính</span>{" "}
              <span>{formatMoneyVND(billData.subtotal)}</span>
            </div>
            {billData.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Giảm giá</span>
                <span>-{formatMoneyVND(billData.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-400">
              <span>VAT (10%)</span>
              <span>{formatMoneyVND(billData.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-orange-500 pt-2 border-t border-white/10">
              <span>TỔNG</span>
              <span>{formatMoneyVND(billData.final_amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-black/40 flex gap-3">
          <button
            onClick={handleDownload}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            title="Tải PDF"
          >
            <FileDown size={20} />
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            title="In Bill Nhiệt"
          >
            <Printer size={20} />
          </button>

          {/* Ẩn nút checkout khi đang dùng Stripe form hoặc QR */}
          {!(
            paymentMethod === "stripe" &&
            (showStripeForm || showStripeQR)
          ) && (
            <button
              onClick={handleCheckout}
              disabled={loading || paymentMethod === "stripe"}
              className="flex-1 bg-linear-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 disabled:opacity-50 transition-all"
            >
              {loading
                ? "Đang xử lý..."
                : paymentMethod === "stripe"
                  ? "Sử dụng Stripe ở trên"
                  : "XÁC NHẬN THANH TOÁN"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillModal;
