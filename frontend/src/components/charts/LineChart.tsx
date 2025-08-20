"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, type ChartData, type ChartOptions, registerables } from "chart.js"
import { useTheme } from "next-themes"

Chart.register(...registerables)

interface LineChartProps {
  data: ChartData;
  viewMode: "yearly" | "monthly";
  isFullscreen?: boolean;
  theme?: "light" | "dark";
}

export default function LineChart({
  data,
  viewMode,
  isFullscreen = false,
  theme: propTheme,
}: LineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { theme } = useTheme();
  const isDark =
    propTheme === "dark" || (propTheme === undefined && theme === "dark");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Enhanced color scheme with better contrast
    const gridColor = isDark
      ? "rgba(75, 85, 99, 0.4)"
      : "rgba(209, 213, 219, 0.4)";
    const textColor = isDark
      ? "rgba(229, 231, 235, 0.9)"
      : "rgba(55, 65, 81, 0.9)";
    const backgroundColor = isDark
      ? "rgba(17, 24, 39, 0.95)"
      : "rgba(255, 255, 255, 0.95)";

    // Responsive sizing based on screen size and fullscreen state
    const getFontSize = (base: number) => {
      if (isMobile) return Math.max(base - 2, 8);
      if (isTablet) return base - 1;
      if (isFullscreen) return base + 1;
      return base;
    };

    const getPadding = (base: number) => {
      if (isMobile) return Math.max(base - 4, 4);
      if (isFullscreen) return base + 4;
      return base;
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: !isMobile || isFullscreen,
          position: isMobile && !isFullscreen ? "bottom" : "top",
          align: "center",
          labels: {
            usePointStyle: true,
            padding: getPadding(16),
            color: textColor,
            boxWidth: getFontSize(12),
            boxHeight: getFontSize(12),
            font: {
              family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              size: getFontSize(12),
              weight: 500,
            },
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: backgroundColor,
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: getPadding(12),
          cornerRadius: 12,
          boxPadding: getPadding(6),
          usePointStyle: true,
          displayColors: true,
          bodyFont: {
            family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            size: getFontSize(13),
            weight: 400,
          },
          titleFont: {
            family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            weight: 600,
            size: getFontSize(14),
          },
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";

              // Truncate long labels on mobile
              if (isMobile && label.length > 15) {
                label = label.substring(0, 15) + "...";
              }

              const value =
                typeof context.parsed.y === "number"
                  ? context.parsed.y.toLocaleString()
                  : context.parsed.y;

              return `${label}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: textColor,
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 45 : 0,
            font: {
              family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              size: getFontSize(11),
              weight: 400,
            },
            padding: getPadding(8),
            // Enhanced mobile tick limiting
            callback: function (value, index, values) {
              if (isMobile) {
                // Show fewer labels on mobile based on screen size
                const skipFactor = Math.ceil(values.length / 4);
                return index % skipFactor === 0
                  ? this.getLabelForValue(value as number)
                  : "";
              } else if (isTablet) {
                const skipFactor = Math.ceil(values.length / 8);
                return index % skipFactor === 0
                  ? this.getLabelForValue(value as number)
                  : this.getLabelForValue(Number(value));
              }
              return this.getLabelForValue(Number(value));
            },
          },
          border: {
            color: gridColor,
          },
        },
        y: {
          grid: {
            color: gridColor,
            display: true,
            drawOnChartArea: true,
            lineWidth: 1,
            tickLength: 0,
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              size: getFontSize(11),
              weight: 400,
            },
            padding: getPadding(8),
            maxTicksLimit: isMobile ? 4 : isTablet ? 6 : 8,
            callback: function (value) {
              // Enhanced number formatting with better readability
              if (typeof value === "number") {
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + "M";
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(1) + "K";
                }
                return value.toLocaleString();
              }
              return value;
            },
          },
          border: {
            dash: [5, 5],
            color: gridColor,
          },
          beginAtZero: true,
        },
      },
      // Enhanced animations with better performance
      animation: {
        duration: isFullscreen ? 1200 : 800,
        easing: "easeInOutCubic",
      },
      // Responsive elements configuration
      elements: {
        line: {
          tension: 0.3,
          borderWidth: isMobile ? 2 : isTablet ? 2.5 : 3,
          borderCapStyle: "round",
          borderJoinStyle: "round",
          fill: false,
        },
        point: {
          radius: isMobile ? 2 : isTablet ? 3 : 4,
          hoverRadius: isMobile ? 4 : isTablet ? 5 : 6,
          borderWidth: isMobile ? 1.5 : 2,
          hoverBorderWidth: 3,
          backgroundColor: backgroundColor,
          borderColor: "currentColor",
          pointStyle: "circle",
        },
      },
      // Enhanced layout with better spacing
      layout: {
        padding: {
          top: getPadding(8),
          right: getPadding(8),
          bottom: getPadding(8),
          left: getPadding(8),
        },
      },
    };

    const chart = new Chart(ctx, {
      type: "line",
      data: data,
      options: options,
    });

    chartInstance.current = chart;

    return () => {
      chart.destroy();
    };
  }, [data, viewMode, isDark, isMobile, isFullscreen, isTablet]);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={chartRef}
        className="h-full w-full transition-all duration-300"
        style={{ maxHeight: "100%" }}
        role="img"
        aria-label={`${viewMode === "yearly" ? "Yearly" : "Monthly"} data trend chart showing ${data.datasets.length} dataset${data.datasets.length !== 1 ? "s" : ""}`}
        aria-describedby="chart-description"
      />

      {/* Hidden description for screen readers */}
      <div id="chart-description" className="sr-only">
        {data.datasets.length > 0 ? (
          <>
            <p>
              Chart displaying {viewMode} data trends with{" "}
              {data.datasets.length} dataset
              {data.datasets.length !== 1 ? "s" : ""}.
            </p>
            <ul>
              {data.datasets.map((dataset, index) => (
                <li key={index}>
                  {dataset.label}: Contains{" "}
                  {Array.isArray(dataset.data) ? dataset.data.length : 0} data
                  points
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No data available to display in the chart.</p>
        )}
      </div>
    </div>
  );
}

// Helper hook for responsive design
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => {
      setMatches(media.matches);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}
