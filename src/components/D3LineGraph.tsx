"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type DataPoint = {
  time: number | string;
  value: number;
};

type D3LineGraphProps = {
  data: DataPoint[];
  isLoading?: boolean;
};

// Helper function to format price values
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

export default function D3LineGraph({ data, isLoading = false }: D3LineGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number } | null>(null);
  
  // Get container dimensions
  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height: 343 }); // Fixed height same as original
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 343 });
        
        // Update labels position on resize
        updateLabelsPosition();
      }
    };
    
    // Function to update the position of all labels
    const updateLabelsPosition = () => {
      if (!containerRef.current || !data || data.length === 0) return;
      
      // Recalculate position based on the last data point
      const margin = { top: 30, right: 50, bottom: 30, left: 20 };
      const width = containerRef.current.getBoundingClientRect().width;
      const innerWidth = width - margin.left - margin.right;
      
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => typeof d.time === 'string' ? parseInt(d.time) : d.time) as [number, number])
        .range([0, innerWidth]);
        
      const lastPoint = data[data.length - 1];
      const lastX = xScale(typeof lastPoint.time === 'string' ? parseInt(lastPoint.time) : lastPoint.time);
      
      // Calculate the position based on last data point
      const labelWidth = 85; // Approximate width of the label
      const labelRight = Math.max(0, width - margin.left - lastX - (labelWidth/2));
      
      // Update last value label position
      if (labelRef.current) {
        labelRef.current.style.right = `${labelRight}px`;
      }
      
      // Update hover price label position if it exists
      const priceLabel = containerRef.current.querySelector('.price-label') as HTMLDivElement;
      if (priceLabel) {
        priceLabel.style.right = `${labelRight}px`;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);
  
  // Draw chart with D3
  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0 || dimensions.width === 0) return;
    
    // Clear previous elements
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    const margin = { top: 30, right: 50, bottom: 30, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG with proper styling
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "transparent")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
   
      
    // Create scales with better domain padding
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => typeof d.time === 'string' ? parseInt(d.time) : d.time) as [number, number])
      .range([0, innerWidth]);
    
    const minY = d3.min(data, d => d.value) as number;
    const maxY = d3.max(data, d => d.value) as number;
    const yPadding = (maxY - minY) * 0.1; // 10% padding
    
    const yScale = d3.scaleLinear()
      .domain([minY - yPadding, maxY + yPadding])
      .range([innerHeight, 0]);
    
    // Generate enhanced histogram data with more pronounced differences
    const histogramData = data.map((item, index) => {
      let difference = 0;
      if (index > 0) {
        difference = Math.abs(item.value - data[index - 1].value);
      } else if (data.length > 1) {
        difference = Math.abs(item.value - data[index + 1].value);
      }
      
      // Amplify differences to make them more visible
      const baseValue = 0.2;
      const scaleFactor = 0.02; // Increased scale factor to make bars more visible
      const scaledDifference = difference * scaleFactor;
      
      return {
        time: item.time,
        value: baseValue + scaledDifference,
      };
    });
    
    // Create separate drawing areas for different chart elements
    // Grid lines should be drawn first (to appear behind other elements)
    const gridArea = svg.append("g").attr("class", "grid-area");
    const chartArea = svg.append("g").attr("class", "chart-area");
    const histogramArea = svg.append("g").attr("class", "histogram-area");
    const hoverArea = svg.append("g").attr("class", "hover-area");
    
    // Create vertical grid lines
    const gridLinesCount = 7;
    const gridStep = innerWidth / (gridLinesCount - 1);
    
    for (let i = 0; i < gridLinesCount; i++) {
      const x = i * gridStep;
      gridArea.append("line")
        .attr("class", "grid-line")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", innerHeight)
        .attr("stroke", "rgba(197, 203, 206, 0.5)")
        .attr("stroke-width", 1);
    }
    
    // Create area generator
    const areaGenerator = d3.area<DataPoint>()
      .x(d => xScale(typeof d.time === 'string' ? parseInt(d.time) : d.time))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Create line generator
    const lineGenerator = d3.line<DataPoint>()
      .x(d => xScale(typeof d.time === 'string' ? parseInt(d.time) : d.time))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Create gradient for area
    const areaGradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
      
    areaGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#E8E7FF");
      
    areaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(232, 231, 255, 0.05)");
      
    // Draw area
    chartArea.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", areaGenerator)
      .attr("fill", "url(#area-gradient)")
      .attr("opacity", 1);
    
    // Draw line with enhanced styling
    chartArea.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "rgb(71, 82, 238)")
      .attr("stroke-width", 2)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineGenerator);
    
    // Add marker at the end of the chart (last data point)
    const lastPoint = data[data.length - 1];
    const lastX = xScale(typeof lastPoint.time === 'string' ? parseInt(lastPoint.time) : lastPoint.time);
    const lastY = yScale(lastPoint.value);
    
    // Create a separate scale for the histogram with improved positioning
    const histogramYScale = d3.scaleLinear()
      .domain([0, d3.max(histogramData, d => d.value) as number * 1.5]) // Increase domain range for taller bars
      .range([innerHeight, innerHeight * 0.55]); // Bottom 25% of the chart for more visible histogram
    
    // Draw histogram bars with improved spacing and styling
    const barWidth = Math.max(3, innerWidth / data.length / 1.2); // Slightly wider bars for better visibility
    
    histogramArea.selectAll(".histogram-bar")
      .data(histogramData)
      .enter()
      .append("rect")
      .attr("class", "histogram-bar")
      .attr("x", d => xScale(typeof d.time === 'string' ? parseInt(d.time) : d.time) - barWidth/2) // Center bars
      .attr("y", d => histogramYScale(d.value))
      .attr("width", barWidth)
      .attr("height", d => innerHeight - histogramYScale(d.value))
      .attr("fill", "rgba(228, 230, 239, 0.9)")
      .attr("margin-bottom", "10px")
      .attr("rx", 1) // Rounded corners
      .attr("ry", 1) // Rounded corners
      .attr("opacity", 1); // Full opacity for better visibility
    
    // Create last value label (top right with dark background)
    const lastValue = lastPoint.value;
    
    // Calculate label position to align with the end of the line chart
    const labelWidth = 85; // Approximate width of the label
    
    // Calculate the position based on last data point instead of fixed edge
    // This will make the label appear right above the last data point's position
    const labelRight = Math.max(0, width - margin.left - lastX - (labelWidth/2));
    
    // Add label container to the DOM (outside SVG) styled to match the reference
    const lastValueLabel = d3.select(containerRef.current)
      .append("div")
      .attr("class", "last-value-label")
      .style("position", "absolute")
      .style("top", `${margin.top + lastY - 15}px`) // Position vertically aligned with the last data point
      .style("right", `${labelRight}px`) // Position aligned with end of chart line
      .style("background-color", "#4B40EE") // Blue background for static label
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("z-index", "5")
      .style("box-shadow", "0px 2px 4px rgba(0,0,0,0.2)")
      .style("font-family", "system-ui, -apple-system, sans-serif")
      .text(formatPrice(lastValue));
      
    // Store the label element in the ref for easier updating
    labelRef.current = lastValueLabel.node();
    
    // Create hover price label (with dark background) - positioned on right side
    const priceLabel = d3.select(containerRef.current)
      .append("div")
      .attr("class", "price-label")
      .style("position", "absolute")
      .style("background-color", "#1A2036") // Dark background for hover label
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("z-index", "5")
      .style("box-shadow", "0px 2px 4px rgba(0,0,0,0.2)")
      .style("opacity", "0")
      .style("pointer-events", "none")
      .style("text-align", "center")
      .style("min-width", "80px")
      .style("right", `${labelRight}px`) // Position relative to chart line, same as static label
      .style("font-family", "system-ui, -apple-system, sans-serif")
      .style("transition", "opacity 0.2s ease")
      .text("");
    
    
    // Handle mouse events for hover effects
    const overlay = hoverArea.append("rect")
      .attr("class", "overlay")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all");
    
    // Create group for hover elements
    const hoverGroup = hoverArea.append("g")
      .attr("class", "hover-group")
      .style("display", "none");
    
    // Add vertical hover line
    const hoverLine = hoverGroup.append("line")
      .attr("class", "hover-line")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#999999")
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", 1);
    
    // Add horizontal hover line
    const hoverHorzLine = hoverGroup.append("line")
      .attr("class", "hover-horz-line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("stroke", "#999999")
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", 1);
    
    // Add hover dot at intersection
    const hoverDot = hoverGroup.append("circle")
      .attr("class", "hover-dot")
      .attr("r", 0)
      .attr("fill", "rgb(71, 82, 238)");
      
    // Update hover elements positions
    hoverLine.attr("x1", lastX).attr("x2", lastX);
    hoverHorzLine.attr("y1", lastY).attr("y2", lastY);
    hoverDot.attr("cx", lastX).attr("cy", lastY);
    
    // Update price label - positioned aligned with horizontal line
    priceLabel
      .style("top", `${margin.top + lastY - 15}px`); // Align with the horizontal line
    
    // If hovering over the last few data points, keep the right position fixed at marker
    // Otherwise keep the default right positioning
    
    priceLabel.text(formatPrice(lastValue));
    
    // Update hovered point for access outside
    setHoveredPoint({ x: lastX, y: lastY, value: lastValue });
    
    // Handle mouse events for hover effects
    overlay
      .on("mousemove", function(event) {
        // Show hover elements
        hoverGroup.style("display", null);
        priceLabel.style("opacity", "1");
        
        // Get mouse position
        const [mouseX, mouseY] = d3.pointer(event);
        
        // Don't proceed if we're outside the valid area
        if (mouseX < 0 || mouseX > innerWidth || mouseY < 0 || mouseY > innerHeight) {
          hoverGroup.style("display", "none");
          priceLabel.style("opacity", "0");
          return;
        }
        
        // Find closest data point
        const bisect = d3.bisector<DataPoint, number>(d => 
          typeof d.time === 'string' ? parseInt(d.time) : d.time).left;
        const x0 = xScale.invert(mouseX);
        const i = bisect(data, x0, 1);
        
        // Handle edge cases
        if (i <= 0 || i >= data.length) {
          return;
        }
        
        const d0 = data[i - 1];
        const d1 = data[i];
        // Find the closest point
        const d = x0 - (typeof d0.time === 'string' ? parseInt(d0.time) : d0.time) > 
                 (typeof d1.time === 'string' ? parseInt(d1.time) : d1.time) - x0 ? d1 : d0;
        
        // Update hover elements positions
        const x = xScale(typeof d.time === 'string' ? parseInt(d.time) : d.time);
        const y = yScale(d.value);
        
        hoverLine.attr("x1", x).attr("x2", x);
        hoverHorzLine.attr("y1", y).attr("y2", y);
        hoverDot.attr("cx", x).attr("cy", y);
        
        // Update price label - positioned aligned with horizontal line
        priceLabel
          .style("top", `${margin.top + y - 15}px`) // Align with the horizontal line
          .text(formatPrice(d.value));
        
        // Update hovered point for access outside
        setHoveredPoint({ x, y, value: d.value });
      })
      .on("mouseleave", function() {
        // Hide hover elements
        hoverGroup.style("display", "none");
        priceLabel.style("opacity", "0");
        setHoveredPoint(null);
      });
    
    // Cleanup function to remove all DOM elements we added
    return () => {
      try {
        // Clean up all labels
        if (labelRef.current) {
          d3.select(labelRef.current).remove();
          labelRef.current = null;
        }
        
        // Find and remove price label
        if (containerRef.current) {
          const priceLabel = containerRef.current.querySelector('.price-label');
          if (priceLabel) {
            priceLabel.remove();
          }
        }
        
        // Remove event listeners
        if (overlay) {
          overlay.on("mousemove", null).on("mouseleave", null);
        }
      } catch (err) {
        console.log("Error during cleanup:", err);
      }
    };
  }, [data, dimensions]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full ${isLoading ? "h-0" : "h-[343px]"} transition-all duration-300`}
    >
      {isLoading ? (
        <div className="block transition-all duration-300">
          ..loading...
        </div>
      ) : (
        <svg ref={svgRef} className="transition-all duration-300" />
      )}
    </div>
  );
} 