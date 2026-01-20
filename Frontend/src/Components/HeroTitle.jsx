import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { useTranslation } from "react-i18next";

// --- Hàm trợ giúp: Tách chuỗi thành từng ký tự bọc trong thẻ span ---
const splitText = (text) => {
  return text.split("").map((char, index) => (
    <span
      key={index}
      className="split-char inline-block whitespace-pre" // inline-block để transform hoạt động, whitespace-pre để giữ khoảng cách
      style={{ opacity: 0 }} // Ẩn ban đầu để tránh nhấp nháy
    >
      {char}
    </span>
  ));
};

const HeroTitle = () => {
  const { t } = useTranslation();
  const titleRef = useRef(null);
  // Ref này để đảm bảo animation chỉ chạy 1 lần khi mount
  const animationRan = useRef(false);

  useLayoutEffect(() => {
    if (animationRan.current) return;

    const ctx = gsap.context(() => {
      // Chọn tất cả các thẻ span có class .split-char bên trong titleRef
      const chars = titleRef.current.querySelectorAll(".split-char");

      gsap.fromTo(
        chars,
        {
          // --- TRẠNG THÁI BẮT ĐẦU (Bay tứ tung) ---
          opacity: 0,
          x: () => gsap.utils.random(-500, 500), // Bay ngẫu nhiên ngang từ -500px đến 500px
          y: () => gsap.utils.random(-300, 300), // Bay ngẫu nhiên dọc
          z: () => gsap.utils.random(-200, 200), // Thêm chút chiều sâu 3D
          rotation: () => gsap.utils.random(-360, 360), // Xoay ngẫu nhiên
          scale: () => gsap.utils.random(0.5, 2), // To nhỏ ngẫu nhiên
        },
        {
          // --- TRẠNG THÁI KẾT THÚC (Về chỗ cũ) ---
          opacity: 1,
          x: 0,
          y: 0,
          z: 0,
          rotation: 0,
          scale: 1,
          duration: 2, // Thời gian bay về mất 2 giây
          ease: "elastic.out(1, 0.5)", // Hiệu ứng nảy nhẹ khi về đích (rất quan trọng để tạo cảm giác vật lý)
          stagger: {
            amount: 0.8, // Tổng thời gian trễ giữa các chữ là 0.8s (chữ về trước chữ về sau)
            from: "random", // Thứ tự về đích ngẫu nhiên
          },
          delay: 0.5, // Chờ 0.5s mới bắt đầu chạy khi vào trang
        },
      );
    }, titleRef); // Scope animation vào trong titleRef để an toàn

    animationRan.current = true;

    return () => ctx.revert(); // Dọn dẹp animation khi component unmount
  }, []);

  // ... (Phần code trên giữ nguyên)

  return (
    <h1
      ref={titleRef}
      className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-2xl overflow-hidden p-2"
    >
      {/* Dòng 1 */}
      <div className="block">{splitText(t("hero.enjoy") + " ")}</div>

      {/* Dòng 2 */}
      <span className="text-orange-500 font-display">
        {splitText(t("hero.essence")).map((span, idx) =>
          React.cloneElement(span, {
            key: idx,
            className: `${span.props.className} font-display`,
          }),
        )}
      </span>
      <br />

      {/* Dòng 3 */}
      <div className="block mt-2">{splitText(t("hero.cuisine"))}</div>
    </h1>
  );
};

export default HeroTitle;
