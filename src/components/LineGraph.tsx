"use client";
import { AreaSeries, createChart } from "lightweight-charts";
import { useEffect, useRef, useMemo, useCallback, useState } from "react";

const chartOptionsSmall = {
  rightPriceScale: {
    ticksVisible: false,
    textColor: "transparent",
    borderColor: "#E2E4E7",
    borderVisible: false, // This removes the right border
    alignLabels: false, // This helps with label positioning
  },
    crosshair: {
      vertLine: {
        labelVisible:false
          
      },
      horzLine: {
      },
  },
  timeScale: {
    visible: true,
    ticksVisible: false,
    tickMarkFormatter: () => "",
    borderColor: "#E2E4E7",
  },
  grid: {
    vertLines: {
      color: "rgba(197, 203, 206, 0.5)",
    },
    horzLines: { visible: false },
  },
};

const returnChartOpionsWithDimensions = (vw: number, vh: number) => {
  return {
    ...chartOptionsSmall,
    width: vw * 0.95,
    height: 343,
  };
};

export default function LineGraph({
  data,
  isMultiple = false,
  isLoading,
  isFullscreen = false,
}: {
  data: any[];
  isMultiple?: boolean;
  isLoading?: boolean;
  isFullscreen?: boolean;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ReturnType<typeof createChart>>();
  const seriesRef = useRef<any>(null);

  // Memoize chart options

  // Memoize data updates
  const updateChartData = useCallback(() => {
    if (data && chartInstanceRef.current) {
      if (seriesRef.current) {
        chartInstanceRef.current.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }

      const areaSeries = chartInstanceRef.current.addSeries(AreaSeries, {
        lineColor: "#4B40EE",
        topColor: "rgba(75, 64, 238, 0.1)",
        bottomColor: "rgba(75, 64, 238, 0.02)",
        lineWidth: 2,
        priceLineColor: "#4B40EE",
      });
      seriesRef.current = areaSeries;
      areaSeries.setData(data);
      
      const labels = chartInstanceRef.current
      console.log({labels})

    }
  }, [data]);

  useEffect(() => {
    if (chartContainerRef.current && !chartInstanceRef.current) {
      const vw = Math.max(
        document?.documentElement?.clientWidth || 0,
        window?.innerWidth || 0
      );
      const vh = Math.max(
        document?.documentElement?.clientHeight || 0,
        window?.innerHeight || 0
      );
      const chartOptions = returnChartOpionsWithDimensions(vw, vh);
      console.log({ chartOptions });
      const chart = createChart(chartContainerRef.current, chartOptions);
      chartInstanceRef.current = chart;
      return () => {
        chart.remove();
        chartInstanceRef.current = undefined;
      };
    }
  }, []);

  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  return (
    <>
      <div
        className={`${
          isLoading ? "block" : "hidden"
        } transition-all duration-300`}
      >
        ..loading...
      </div>
      <div
        ref={chartContainerRef}
        className={`${isLoading ? "h-0 w-0" : ""} transition-all duration-300`}
      />
    </>
  );
}
