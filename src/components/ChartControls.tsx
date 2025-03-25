"use client";
import Image from "next/image";
import MultiSelectWrapper from "@/components/MultiSelectWrapper";
import { Asset, coinCapService } from "@/services/coinCap";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LineGraph = dynamic(() => import("@/components/LineGraph"), {
  ssr: false,
});

const timePeriods = [
  { title: "1m", value: "m1" },
  { title: "5m", value: "m5" },
  { title: "15m", value: "m15" },
  { title: "30m", value: "m30" },
  { title: "1h", value: "h1" },
  { title: "2h", value: "h2" },
  { title: "6h", value: "h6" },
  { title: "12h", value: "h12" },
  { title: "1d", value: "d1" },
];

export default function ChartControls({
  isFullscreen = false,
  assetId = "BTC",
}: {
  isFullscreen?: boolean;
  assetId?: string;
}) {
  const [activeTimePeriod, setActiveTimePeriod] = useState(timePeriods[1]);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [btcMarketData, setBtcMarketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAssetSelection = (assets: Asset[]) => {
    setSelectedAssets(assets);
  };

  useEffect(() => {
    const fetchBtcMarketData = async () => {
      setIsLoading(true);
      const data = await coinCapService.getAssetHistory(
        "bitcoin",
        activeTimePeriod.value
      );
      const transformedData = data
        .map((item) => ({
          time: Math.floor(
            new Date(new Date(item.date).toISOString().slice(0, 19)).getTime() /
              1000
          ) as any,
          value: parseFloat(item.priceUsd),
        }))
        .sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );
      setBtcMarketData(transformedData);
      setIsLoading(false);
    };
    fetchBtcMarketData();
  }, [selectedAssets, activeTimePeriod]);

  return (
    <div className=" h-full ">
      <div
        className={`flex justify-between mb-[40px] ${
          !isFullscreen ? "w-[60vw]" : "w-[90vw]"
        }`}
      >
        <div className="flex gap-[30px] items-center">
          <div className="flex gap-[10px] items-center">
            <Image src="/assets/arrow.svg" alt="chart" width={24} height={24} />
            <a
              href={isFullscreen ? "/" : "/fullscreen"}
              className="text-md font-medium text-[#1A243A]"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </a>
          </div>

          <div className="flex gap-[10px] items-center">
            <Image src="/assets/add.svg" alt="chart" width={24} height={24} />
            <div className="relative">
              <MultiSelectWrapper onSelect={handleAssetSelection} />
              <p className="text-sm text-[#6F7177] font-medium absolute left-0">
                Max 3
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-[10px] items-center">
          {timePeriods.map((timePeriod, index) => (
            <button
              key={index}
              className={`text-md text-[#6F7177] font-medium ${
                activeTimePeriod.value === timePeriod.value
                  ? "text-white bg-primary rounded-lg px-[10px] py-[5px]"
                  : ""
              }`}
              onClick={() => setActiveTimePeriod(timePeriod)}
            >
              {timePeriod.title}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-full min-w-[600px] ">
        <div className="border-[1px] border-primary rounded-lg px-[10px] py-[5px] w-fit mb-4">
          <p className="text-sm text-primary font-medium">{assetId}</p>
        </div>
        <LineGraph
          data={btcMarketData}
          isLoading={isLoading}
          isFullscreen={isFullscreen}
        />
      </div>
    </div>
  );
}
