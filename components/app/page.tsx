// File: src/app/page.tsx
// อธิบาย: นี่คือไฟล์หน้าหลักของเว็บคุณ
// เราจะ import คอมโพเนนต์ LiquidGlassCanvas เข้ามาใช้เป็นพื้นหลัง

import LiquidGlassCanvas from "@/components/LiquidGlassCanvas";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      
      {/* พื้นหลังแอนิเมชัน */}
      <LiquidGlassCanvas />

      {/* เนื้อหาของเว็บจะอยู่ด้านบน (z-10) */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-8">
          {/* ใช้แท็ก img ธรรมดาเพื่อความเข้ากันได้ */}
          <img
            src="public/favicon.svg"
            alt="ThaiFoodie Logo"
            width={150}
            height={150}
            className="rounded-full border-4 border-white shadow-lg"
          />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
          ThaiFoodie
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mb-8" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.7)'}}>
          ค้นพบรสชาติอาหารไทยแท้ๆ ที่ปลายนิ้วของคุณ สำรวจสูตรอาหารต้นตำรับ ร้านอาหารแนะนำ และเรื่องราววัฒนธรรมอาหารที่น่าสนใจ
        </p>
        <div className="flex space-x-4">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full transition-transform transform hover:scale-105 shadow-lg">
            สำรวจสูตรอาหาร
          </button>
          <button className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-full transition-transform transform hover:scale-105 shadow-lg">
            ค้นหาร้านอาหาร
          </button>
        </div>
      </div>
    </main>
  );
}
