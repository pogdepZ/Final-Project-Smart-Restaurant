import { forwardRef } from "react";

const Input = forwardRef(({ label, error, className = "", icon: Icon, ...props }, ref) => {
  return (
    <div className="flex flex-col w-full space-y-2">
      {label && (
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {/* Render Icon nếu có truyền vào */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-orange-400 transition-colors">
            <Icon size={18} />
          </div>
        )}

        <input
          ref={ref}
          className={`w-full ${Icon ? 'pl-11' : 'px-4'} pr-4 py-3.5 
            bg-white/5 border rounded-xl text-white placeholder:text-gray-600 
            transition-all duration-300 outline-none
            focus:ring-1 focus:ring-orange-500/50
            ${error ? "border-red-500/50 bg-red-500/5" : "border-white/10 focus:border-orange-500/50"} 
            ${className}`}
          {...props}
        />
      </div>

      {error && (
        <p className="text-red-400 text-[11px] font-medium mt-1 ml-1 tracking-wide italic">
          * {error.message || error}
        </p>
      )}
    </div>
  );
});

export default Input;