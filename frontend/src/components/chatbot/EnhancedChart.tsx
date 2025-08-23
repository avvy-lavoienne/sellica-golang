/**
 * Enhanced Chart Component with Glass-morphism Design
 * Enterprise-grade visualization with WCAG 2.1 AA compliance
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { cn } from '@/lib/conn/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2,
  ChevronDown,
  ChevronRight,
  Eye,
  BarChart3
} from 'lucide-react';
// import { ChartConfig, ChartInsight, VisualizationType } from '@/services/chatbot/visualizationEngine'; // Moved to legacy backend
type ChartConfig = any;
type ChartInsight = any;
type VisualizationType = any;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface EnhancedChartProps {
  config: ChartConfig;
  onInsightClick?: (insight: ChartInsight) => void;
  onDataPointClick?: (dataPoint: any) => void;
  className?: string;
  height?: number;
}

export function EnhancedChart({
  config,
  onInsightClick,
  onDataPointClick,
  className,
  height = 300
}: EnhancedChartProps) {
  const chartRef = useRef<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth animation
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getChartComponent = () => {
    // Transform data to be compatible with Chart.js
    const chartData = {
      labels: config.data.labels,
      datasets: config.data.datasets.map((dataset: any) => ({
        ...dataset,
        data: dataset.data as number[]
      }))
    };

    const commonProps = {
      ref: chartRef,
      data: chartData,
      options: {
        ...config.options,
        onClick: (event: any, elements: any[]) => {
          if (elements.length > 0 && config.interactivity.clickable) {
            const dataPoint = elements[0];
            const query = config.interactivity.onDataPointClick?.(dataPoint);
            if (query && onDataPointClick) {
              onDataPointClick({ query, dataPoint });
            }
          }
        }
      }
    };

    switch (config.type) {
      case 'trend_line':
        return <Line {...commonProps} />;
      case 'comparison_bar':
        return <Bar {...commonProps} />;
      case 'status_distribution':
        return <Doughnut {...commonProps} />;
      default:
        return <Line {...commonProps} />;
    }
  };

  const getInsightIcon = (type: ChartInsight['type']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pattern':
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: ChartInsight['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `chart-${config.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = url;
      link.click();
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <Card className={cn(
        "border-0 shadow-lg backdrop-blur-md",
        "bg-gradient-to-br from-background/80 via-background/60 to-background/40",
        "border border-border/20 hover:border-border/40 transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5",
        isExpanded && "fixed inset-4 z-50 max-w-none max-h-none"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-foreground">
                {config.title}
              </CardTitle>
              {config.subtitle && (
                <p className="text-sm text-muted-foreground">
                  {config.subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Confidence Badge */}
              <Badge variant="outline" className="text-xs">
                {Math.round((config.data.metadata.confidence || 0) * 100)}% akurat
              </Badge>
              
              {/* Chart Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 w-8 p-0"
                  aria-label="Download chart"
                >
                  <Download className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpand}
                  className="h-8 w-8 p-0"
                  aria-label={isExpanded ? "Minimize chart" : "Expand chart"}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Chart Container */}
          <div 
            className="relative"
            style={{ height: isExpanded ? 'calc(100vh - 300px)' : height }}
          >
            <AnimatePresence>
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Memuat visualisasi...</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {getChartComponent()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chart Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {config.data.metadata.totalPoints} data points
              {config.data.metadata.timeRange && (
                <> • {config.data.metadata.aggregationType} aggregation</>
              )}
            </span>
            <span>
              Updated: {new Date().toLocaleTimeString('id-ID')}
            </span>
          </div>

          {/* Chart Insights */}
          {config.insights.length > 0 && (
            <div className="border-t border-border/20 pt-4">
              <Collapsible open={showInsights} onOpenChange={setShowInsights}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between p-2 h-auto"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Insight Analisis</span>
                      <Badge variant="secondary" className="text-xs">
                        {config.insights.length} insights
                      </Badge>
                    </div>
                    {showInsights ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-3 mt-3">
                  {config.insights.map((insight: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                        "bg-muted/30 hover:bg-muted/50 border-border/20 hover:border-border/40"
                      )}
                      onClick={() => onInsightClick?.(insight)}
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{insight.title}</span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getSeverityColor(insight.severity))}
                            >
                              {insight.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(insight.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          {insight.actionable && insight.suggestedAction && (
                            <div className="text-xs text-primary">
                              💡 {insight.suggestedAction}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Interactive Elements */}
          {config.interactivity.clickable && (
            <div className="text-xs text-muted-foreground text-center py-2 border-t border-border/20">
              💡 Klik pada data point untuk analisis lebih detail
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded Chart Overlay */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={handleExpand}
        />
      )}
    </motion.div>
  );
}
