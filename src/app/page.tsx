"use client";
import ChartControls from "@/components/ChartControls";

const tabTitles = [
  { title: "Summary", isActive: false },
  { title: "Chart", isActive: true },
  { title: "Statistics", isActive: false },
  { title: "Analysis", isActive: false },
  { title: "Settings", isActive: false },
];


export default function Home() {
  return (
    <div className="p-10">
      <div className="mb-[40px]">
        <div className="flex gap-2">
          <h3 className="text-6xl font-medium text-[#1A243A]">63,765.46</h3>
          <h6 className="text-2xl font-medium text-[#BDBEBF]">USD</h6>
        </div>
        <div className="mt-3">
          <p className="text-[#67BF6B] text-md font-medium">
            + 2,161.42 (3.54%)
          </p>
        </div>
      </div>

      <div className="flex gap-[30px] mb-[60px] border-b border-[#EFF1F3]">
        {tabTitles.map((tab, index) => (
          <div
            key={index}
            className={`font-normal text-md text-[#6F7177] px-[10px] pb-[20px] ${
              tab.isActive ? "border-b-[3px] border-primary text-[#1A243A]" : ""
            }`}
          >
            {tab.title}
          </div>
        ))}
      </div>

      <ChartControls  />
    </div>
  );
}
