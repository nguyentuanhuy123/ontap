import React from 'react';

const SaveNotice = ({ onSave, onReset, isLoading }) => {
  return (
    // Thay đổi bottom-10 thành bottom-4 trên mobile để tiết kiệm diện tích, w-[95%] để sát viền hơn
    <div className="fixed bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] max-w-[740px] z-[200]">
      <div className="bg-[#111214] rounded-lg p-3 md:px-4 flex flex-col sm:flex-row items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 gap-3 sm:gap-0">
        
        {/* Phần thông báo: Căn giữa trên mobile, căn trái trên PC */}
        <span className="text-white font-medium text-sm md:text-[15px] text-center sm:text-left">
          Hãy cẩn thận — bạn chưa lưu các thay đổi!
        </span>

        {/* Cụm nút bấm: Dàn hàng ngang đều trên mobile */}
        <div className="flex gap-4 md:gap-5 items-center w-full sm:w-auto justify-center sm:justify-end">
          <button 
            onClick={onReset}
            className="text-white text-sm font-medium hover:underline transition-all disabled:opacity-50 py-2 px-1"
            disabled={isLoading}
          >
            Đặt lại
          </button>
          
          <button 
            onClick={onSave}
            disabled={isLoading}
            className={`
              bg-[#248046] hover:bg-[#1A6334] text-white 
              px-5 py-2 md:px-4 rounded-[3px] text-sm font-medium 
              transition-colors duration-200 flex items-center gap-2
              w-full sm:w-auto justify-center
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