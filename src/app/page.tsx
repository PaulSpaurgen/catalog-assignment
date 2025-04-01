"use client";
import ChartControls from "@/components/ChartControls";
import { coinCapService } from "@/services/coinCap";
import { useEffect, useState } from "react";

const tabTitles = [
  { title: "Summary", isActive: false },
  { title: "Chart", isActive: true },
  { title: "Statistics", isActive: false },
  { title: "Analysis", isActive: false },
  { title: "Settings", isActive: false },
];


export default function Home() {
  const [assetData, setAssetData] = useState<any>(null);

  useEffect(() => {
    coinCapService.getAssetData("bitcoin").then((data) => {
      console.log({data});
      setAssetData(data);
    });
  }, []);

  return (
    <div className="p-10">
      <div className="mb-[40px]">
        <div className="flex items-start gap-2">
          <p className="text-[70px] font-medium text-[#1A243A] leading-none">{assetData?.priceUsd ? parseFloat(assetData?.priceUsd).toFixed(2) : ""}</p>
          <span className="text-2xl font-medium text-[#BDBEBF] leading-none mt-2">USD</span>
        </div>
        <div className="mt-3">
          <p className={`text-md font-medium ${assetData?.changePercent24Hr > 0 ? "text-[#67BF6B]" : "text-[#FF4D4D]"}`}>
            {parseFloat(assetData?.changePercent24Hr).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="flex gap-[30px] mb-[60px] border-b border-[#EFF1F3]">
        {tabTitles.map((tab, index) => (
          <div
            key={index}
            className={`font-medium text-md  px-[10px] pb-[20px] ${
              tab.isActive ? "border-b-[3px] border-primary text-[#1A243A]" : "text-[#6F7177]"
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
