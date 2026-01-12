import React from "react";

const QRTemplate = ({ id, table, qrSrc }) => {
  return (
    <div
      id={id}
      style={{
        position: "absolute",
        top: "-9999px",
        left: "-9999px", // Ẩn khỏi màn hình
        width: "600px",
        height: "800px", // Khổ giấy mô phỏng
        backgroundColor: "white",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "10px solid #000",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Restaurant Logo (Optional) */}
      <h1
        style={{ fontSize: "40px", fontWeight: "bold", marginBottom: "10px" }}
      >
        SMART RESTAURANT
      </h1>

      <div
        style={{
          width: "100%",
          borderBottom: "2px solid #000",
          margin: "20px 0",
        }}
      ></div>

      {/* Table Number Prominently Displayed */}
      <h2 style={{ fontSize: "80px", fontWeight: "900", margin: "20px 0" }}>
        {table.table_number}
      </h2>
      <p style={{ fontSize: "24px", color: "#555", marginBottom: "40px" }}>
        {table.location}
      </p>

      {/* QR Code Centered */}
      <img
        src={qrSrc}
        style={{
          width: "350px",
          height: "350px",
          border: "5px solid #000",
          borderRadius: "20px",
        }}
      />

      {/* Scan Instruction */}
      <p
        style={{
          fontSize: "30px",
          fontWeight: "bold",
          marginTop: "40px",
          textTransform: "uppercase",
        }}
      >
        Scan to Order
      </p>
      <p style={{ fontSize: "18px", color: "#777", marginTop: "10px" }}>
        Sử dụng Camera điện thoại hoặc Zalo để quét
      </p>

      {/* WiFi Info (Optional) */}
      <div
        style={{
          marginTop: "50px",
          padding: "15px",
          border: "1px dashed #000",
          borderRadius: "10px",
          width: "80%",
        }}
      >
        <p style={{ margin: 0, fontSize: "18px" }}>
          📶 <strong>Free WiFi:</strong> SmartRest_Guest
        </p>
        <p style={{ margin: "5px 0 0 0", fontSize: "18px" }}>
          🔑 <strong>Pass:</strong> 12345678
        </p>
      </div>
    </div>
  );
};

export default QRTemplate;
