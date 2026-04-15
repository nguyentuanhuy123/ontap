import React from 'react';

const SaveNotice = ({ onSave, onReset, isLoading }) => {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[740px] z-[200]">
      <div className="bg-[#111214] rounded-lg p-3 px-4 flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
        
        {/* Phần thông báo bên trái */}
        <span className="text-white font-medium text-[15px]">
          Hãy cẩn thận — bạn chưa lưu các thay đổi!
        </span>

        {/* Cụm nút bấm bên phải */}
        <div className="flex gap-5 items-center">
          <button 
            onClick={onReset}
            className="text-white text-sm font-medium hover:underline transition-all disabled:opacity-50"
            disabled={isLoading}
          >
            Đặt lại
          </button>
          
          <button 
            onClick={onSave}
            disabled={isLoading}
            className={`
              bg-[#248046] hover:bg-[#1A6334] text-white 
              px-4 py-2 rounded-[3px] text-sm font-medium 
              transition-colors duration-200 flex items-center gap-2
              ${isLoading ? "opacity-70 cursor-not-allowed" : "active:bg-[#144d28]"}
            `}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveNotice;