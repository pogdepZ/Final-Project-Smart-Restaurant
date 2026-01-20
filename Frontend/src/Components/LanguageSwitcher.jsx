import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";

const languages = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export default function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get the base language code (e.g., "vi" from "vi-VN")
  const currentLangCode = i18n.language?.split("-")[0] || "vi";
  const currentLang =
    languages.find((l) => l.code === currentLangCode) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = async (langCode) => {
    console.log("Changing language to:", langCode);
    console.log("Current language before:", i18n.language);
    await i18n.changeLanguage(langCode);
    console.log("Current language after:", i18n.language);
    localStorage.setItem("i18nextLng", langCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full 
                   bg-neutral-900 border border-neutral-800
                   hover:border-orange-500/50 transition-all
                   text-sm text-gray-200 hover:text-white"
        aria-label={t("language.switchLanguage")}
      >
        <Globe size={16} className="text-orange-400" />
        <span className="hidden sm:inline">{currentLang.flag}</span>
        <span className="text-xs font-medium uppercase">
          {currentLang.code}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-40
                      bg-neutral-900 border border-neutral-800 rounded-xl
                      shadow-xl shadow-black/20 overflow-hidden z-50
                      animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3
                         text-left text-sm transition-colors
                         ${
                           currentLangCode === lang.code
                             ? "bg-orange-500/10 text-orange-400"
                             : "text-gray-300 hover:bg-neutral-800 hover:text-white"
                         }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {currentLangCode === lang.code && (
                <Check size={16} className="text-orange-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
