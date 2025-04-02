"use client";
import { AreaSeries, createChart, HistogramSeries, PriceLineSource, Time, AreaData, HistogramData } from "lightweight-charts";
import { useEffect, useRef, useCallback } from "react";

const chartOptionsSmall = {
  rightPriceScale: {
    ticksVisible: false,
    textColor: "transparent",
    borderColor: "#E2E4E7",
    visible: true,
  },
  crosshair: {
    vertLine: {
      labelVisible: false,
      color: '#999999',
    },
    horzLine: {
      color: '#999999',
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

type ChartDataType = (AreaData<Time> | HistogramData<Time>)[];

const returnChartOptionsWithDimensions = (vw: number, vh: number) => {
  return {
    ...chartOptionsSmall,
    width: vw * 0.95,
    height: 343,
  };
};

export default function LineGraph({
  data,
  isLoading,
}: {
  data: ChartDataType;
  isMultiple?: boolean;
  isLoading?: boolean;
  isFullscreen?: boolean;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ReturnType<typeof createChart>>();
  const seriesRef = useRef<any>(null);
  const histogramSeriesRef = useRef<any>(null);
  const resizeListenerRef = useRef<() => void>();

  const updateChartData = useCallback(() => {
    if (data && data.length > 0 && seriesRef.current && histogramSeriesRef.current) {
      console.log("data", data);
      seriesRef.current.setData(data);
      
      const histogramData = data.map((item, index) => {
        let difference = 0;
        if (index > 0) {
          difference = Math.abs(item.value - data[index - 1].value);
        } else if (data.length > 1) {
          difference = Math.abs(item.value - data[index + 1].value);
        }
        
        const baseValue = 0.5;
        const scaledDifference = difference * 0.006;
        
        return {
          time: item.time,
          value: baseValue + scaledDifference,
         
        };
      });
      
      histogramSeriesRef.current.setData(histogramData);
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
      const chartOptions = returnChartOptionsWithDimensions(vw, vh);
      const chart = createChart(chartContainerRef.current, chartOptions);
      chartInstanceRef.current = chart;

      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: "rgb(71, 82, 238)",
        topColor: "rgba(71, 82, 238, 0.15)",
        bottomColor: "rgba(71, 82, 238, 0.02)",
        lineWidth: 2,
        priceLineVisible: true,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        }
      });

      const histogramSeries = chart.addSeries(HistogramSeries, {
        color: "#E2E4E7",
        lastValueVisible: false,
        priceLineVisible: false,
        visible: true,
        priceScaleId: '',
        priceFormat: {
          type: 'volume',
        },
        baseLineVisible: false, 
      });

      areaSeries.priceScale().applyOptions({
        scaleMargins: { top: 0, bottom: 0.4 },
        visible: true,
        autoScale: true,
      });

      histogramSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.6, bottom: 0.008 },
        visible: false,
        alignLabels: true,
        autoScale: true,
      });

      chartInstanceRef.current.timeScale().applyOptions({
        barSpacing: 4,
      });

      seriesRef.current = areaSeries;
      histogramSeriesRef.current = histogramSeries;

      if (data && data.length > 0) {
        areaSeries.setData(data);
        histogramSeries.setData(data);
      }
      
      const handleResize = () => {
        if (chartInstanceRef.current && chartContainerRef.current) {
          const vw = Math.max(
            document?.documentElement?.clientWidth || 0,
            window?.innerWidth || 0
          );
          chartInstanceRef.current.applyOptions({
            width: vw * 0.95,
            height: 343,
          });
        }
      };
      
      window.addEventListener('resize', handleResize);
      resizeListenerRef.current = handleResize;
    }

    return () => {
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current);
      }
      
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  return (
    <>
      <div className={`${isLoading ? "block" : "hidden"} transition-all duration-300`}>
        ..loading...
      </div>
      <div
        ref={chartContainerRef}
        className={`${isLoading ? "h-0 w-0" : ""} transition-all duration-300`}
      />
    </>
  );
}
