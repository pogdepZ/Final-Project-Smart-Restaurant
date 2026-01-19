import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { MapPin, X, Users, Armchair } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { tableApi } from "../../services/tableApi";

const Booking = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort
  const [filters, setFilters] = useState({
    status: "",
    location: "",
    sort: "name_asc",
  });

  const [selectedTable, setSelectedTable] = useState(null);
  const navigate = useNavigate();

  // --- HELPER: Group flat API data by Location ---
  const groupTablesByLocation = (tablesData) => {
    if (!Array.isArray(tablesData)) return [];

    const grouped = tablesData.reduce((acc, table) => {
      const locationName = table.location || "Khu vực khác";

      if (!acc[locationName]) {
        acc[locationName] = [];
      }
      acc[locationName].push(table);
      return acc;
    }, {});

    // Convert object to array: [{ name: "Outdoor", tables: [...] }]
    return Object.keys(grouped).map((key) => ({
      name: key,
      tables: grouped[key],
    }));
  };

  // Fetch tables whenever filters changes
  useEffect(() => {
    let mounted = true;

    const fetchTables = async () => {
      setLoading(true);
      try {
        const data = await tableApi.getTables(filters);

        if (!mounted) return;

        // Transform the flat data into the nested structure needed for rendering
        const processedData = groupTablesByLocation(
          Array.isArray(data) ? data : [],
        );
        setAreas(processedData);
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "Lỗi tải danh sách bàn");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTables();
    return () => {
      mounted = false;
    };
  }, [filters]); // Simplified dependency array

  // click table -> open QR modal
  const handleTableClick = (table) => {
    // Check nếu bàn đã có khách (current_session_id khác null) thì không cho chọn
    const isOccupied =
      table.status === "occupied" || table.current_session_id != null;
    if (isOccupied) {
      toast.warning(
        `Bàn ${table.table_number} đang có khách, vui lòng chọn bàn khác!`,
      );
      return;
    }
    setSelectedTable(table);
  };

  // simulate scan
  const handleSimulateScan = () => {
    if (selectedTable) {
      // Sửa dòng này: Thêm query param token vào URL
      navigate(`/scan/${selectedTable.id}?qrToken=${selectedTable.qr_token}`);
    }
  };

  // helper: seats field fallback
  const getSeats = (table) => {
    return table.capacity ?? table.seats ?? 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Đang tải sơ đồ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <MapPin className="text-orange-500" /> Sơ Đồ Bàn Ăn
          </h1>
          <p className="text-gray-400">Chọn bàn trống để lấy mã QR gọi món</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-neutral-800 border border-white/20" />
            <span className="text-gray-300">Bàn Trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500" />
            <span className="text-orange-500 font-bold">Đang Có Khách</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-900/20 border border-red-500/50" />
            <span className="text-red-400">Đã Đặt Trước</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-10">
          {areas.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              Không tìm thấy bàn nào phù hợp.
            </div>
          ) : (
            areas.map((area) => (
              <div key={area.name}>
                <h2 className="text-xl font-bold text-orange-400 mb-4 border-l-4 border-orange-500 pl-3">
                  {area.name} {/* This will be "Outdoor", "Indoor", etc. */}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {(area.tables || []).map((table) => {
                    // Logic mapping based on your API response
                    // Check current_session_id để biết bàn có khách hay không
                    const hasActiveSession = table.current_session_id != null;
                    const isOccupied =
                      table.status === "occupied" || hasActiveSession;
                    const isReserved = table.status === "reserved";
                    const isAvailable =
                      (table.status === "available" ||
                        table.status === "active") &&
                      !hasActiveSession;

                    return (
                      <button
                        key={table.id} // FIX: Changed a.id to table.id
                        onClick={() => handleTableClick(table)}
                        disabled={isOccupied || isReserved}
                        className={`
                          relative group p-4 rounded-xl border-2 transition-all duration-300
                          flex flex-col items-center justify-center gap-2 min-h-30
                          ${
                            isAvailable
                              ? "bg-neutral-900 border-white/10 hover:border-orange-500 hover:bg-neutral-800 cursor-pointer"
                              : ""
                          }
                          ${
                            isOccupied
                              ? "bg-orange-500/10 border-orange-500/50 cursor-not-allowed"
                              : ""
                          }
                          ${
                            isReserved
                              ? "bg-red-900/10 border-red-500/30 opacity-60 cursor-not-allowed"
                              : ""
                          }
                        `}
                      >
                        <Armchair
                          size={32}
                          className={`
                            ${
                              isAvailable
                                ? "text-gray-400 group-hover:text-orange-500"
                                : ""
                            }
                            ${isOccupied ? "text-orange-500" : ""}
                            ${isReserved ? "text-red-500" : ""}
                          `}
                        />

                        <span
                          className={`font-bold text-lg ${
                            isOccupied ? "text-orange-500" : "text-white"
                          }`}
                        >
                          {/* FIX: Use table_number instead of name */}
                          {table.table_number}
                        </span>

                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users size={12} />
                          <span>{getSeats(table)} chỗ</span>
                        </div>

                        {isOccupied && (
                          <>
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[10px] text-orange-400 font-bold uppercase mt-1">
                              Đang có khách
                            </span>
                          </>
                        )}

                        {isReserved && (
                          <span className="text-[10px] text-red-400 font-bold uppercase mt-1">
                            Đã đặt trước
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR MODAL */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl shadow-orange-500/10 transform transition-all scale-100">
            <button
              onClick={() => setSelectedTable(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">
                {selectedTable.table_number}
              </h3>
              <p className="text-orange-500 text-sm font-medium mb-6">
                Quét mã để gọi món
              </p>

              <div className="bg-white p-4 rounded-xl inline-block mb-6 mx-auto">
                <QRCode
                  value={`${window.location.origin}/scan/${selectedTable.id}?qrToken=${selectedTable.qr_token}`}
                  size={200}
                  level="H"
                />
              </div>

              <p className="text-gray-400 text-sm mb-6 px-4">
                Sử dụng Camera hoặc Zalo để quét mã trên. <br />
                Hệ thống sẽ tự động nhận diện bàn của bạn.
              </p>

              <button
                onClick={handleSimulateScan}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Vào bàn ngay (Giả lập)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
