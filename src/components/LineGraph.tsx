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

// Using proper types from lightweight-charts
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
  const resizeListenerRef = useRef<() => void>(); // Store resize listener for cleanup

  // Memoize data updates - now only handles data updates
  const updateChartData = useCallback(() => {
    if (data && data.length > 0 && seriesRef.current && histogramSeriesRef.current) {
      seriesRef.current.setData(data);
      histogramSeriesRef.current.setData(data);
    }
  }, [data]);

  // Initial setup effect - handles chart and series creation
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

      // Create area series with its own price scale
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: "rgb(71, 82, 238)",
        topColor: "rgba(71, 82, 238, 0.15)",
        bottomColor: "rgba(71, 82, 238, 0.02)",
        lineWidth: 2,
        priceLineVisible: true,
        priceLineColor: "#4752EE",
        crosshairMarkerVisible: false,
        lastValueVisible: true,
        lastPriceAnimation: 1,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        }
      });

      const histogramSeries = chart.addSeries(HistogramSeries, {
        color: "rgba(226, 228, 231, 1)",
        lastValueVisible: false,
        priceLineVisible: false,
        visible: true,
        priceScaleId: 'volume',
      });

      areaSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.1, bottom: 0.2 },
        visible: true,
        autoScale: true,
      });

      // Configure the volume scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
        visible: false, 
        alignLabels: true,
        autoScale: true,
      });

      seriesRef.current = areaSeries;
      histogramSeriesRef.current = histogramSeries;

      if (data && data.length > 0) {
        areaSeries.setData(data);
        histogramSeries.setData(data);
      }

      chartInstanceRef.current.applyOptions({
        handleScale: {
          axisPressedMouseMove: true,
        },
        handleScroll: {
          vertTouchDrag: false,
        },
        rightPriceScale: {
          visible: true,
          autoScale: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        },
      });

      // Apply label styling separately
      areaSeries.applyOptions({
        priceLineSource: PriceLineSource.LastVisible,
        lastPriceAnimation: 1,
      });
      
      // Setup resize listener
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
      // Store the listener for cleanup
      resizeListenerRef.current = handleResize;
    }

    // Cleanup function
    return () => {
      // Remove resize event listener
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current);
      }
      
      // Clean up chart instance
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = undefined;
      }
    };
  }, []); // Empty dependency array since this should only run once

  // Effect for data updates
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
