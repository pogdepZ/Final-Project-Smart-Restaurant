import { useRef, useCallback } from "react";

export function useNotificationSound(soundUrl = "/sounds/notification.mp3") {
  const audioRef = useRef(null);

  const play = useCallback(() => {
    try {
      // Tạo mới mỗi lần để có thể phát chồng nhiều lần
      const audio = new Audio(soundUrl);
      audio.volume = 0.7; // Điều chỉnh âm lượng (0.0 - 1.0)

      // Play và bắt lỗi nếu browser block autoplay
      audio.play().catch((err) => {
        console.warn("🔇 Không thể phát âm thanh:", err.message);
      });

      audioRef.current = audio;
    } catch (error) {
      console.warn("🔇 Lỗi tạo audio:", error);
    }
  }, [soundUrl]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { play, stop };
}
