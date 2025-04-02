"use client";
import Image from "next/image";
import MultiSelectWrapper from "@/components/MultiSelectWrapper";
import { Asset, coinCapService } from "@/services/coinCap";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRef } from "react";

const D3LineGraph = dynamic(() => import("@/components/D3LineGraph"), {
  ssr: false,
});

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

export default function ChartControls() {
  const [activeTimePeriod, setActiveTimePeriod] = useState(timePeriods[1]);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [btcMarketData, setBtcMarketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showD3LineGraph, setShowD3LineGraph] = useState(false);

  const multiSelectRef = useRef<HTMLInputElement>(null);

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
    <div className=" h-full w-full max-w-[91.2vw]">
      <div className="flex justify-between mb-[40px] w-full">
        <div className="flex gap-[30px] items-center">
          <div className="flex gap-[10px] items-center">
            <Image src="/assets/arrow.svg" alt="chart" width={24} height={24} />

            <button className="text-md font-medium text-[#1A243A]" onClick={() => setShowD3LineGraph(!showD3LineGraph)}>Fullscreen</button>
          </div>

          <div className="flex gap-[10px] items-center">
            <button
              className="cursor-pointer"
              onClick={() => {
                const eleTofocus = document.getElementById(
                  "multi_select_custom_input"
                );
                if (eleTofocus) {
                  eleTofocus.focus();
                }
              }}
            >
              <Image src="/assets/add.svg" alt="chart" width={24} height={24} />
            </button>
            <div className="relative">
              <MultiSelectWrapper
                onSelect={handleAssetSelection}
                multiSelectRef={multiSelectRef}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-[20px] items-center">
          {timePeriods.map((timePeriod, index) => (
            <button
              key={index}
              className={`text-md text-[#6F7177] font-medium ${
                activeTimePeriod.value === timePeriod.value
                  ? "text-white bg-primary rounded-[5px] px-[14px] py-[5px]"
                  : ""
              } `}
              onClick={() => setActiveTimePeriod(timePeriod)}
            >
              {timePeriod.title}
            </button>
          ))}
        </div>
      </div>
      {!isLoading && (!btcMarketData || btcMarketData.length === 0) && (
        <div className="text-center mb-4 text-red-500">
          No data available. Please refresh the page after a few seconds to see the data.
        </div>
      )}
      {showD3LineGraph ? (
        <D3LineGraph
          data={btcMarketData}
          isLoading={isLoading}
        />
      ) : (
        <LineGraph
          data={btcMarketData}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
