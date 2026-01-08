import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

const CandlestickChart = ({ 
  data, 
  loading, 
  onRangeSelect,
  selectedRange,
  height = 400 
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: 'solid', color: '#FFFFFF' },
        textColor: '#2E2620',
        fontFamily: 'Manrope, sans-serif',
      },
      grid: {
        vertLines: { color: '#E6DCCF', style: 1 },
        horzLines: { color: '#E6DCCF', style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#C86F4A',
          width: 1,
          style: 2,
          labelBackgroundColor: '#C86F4A',
        },
        horzLine: {
          color: '#C86F4A',
          width: 1,
          style: 2,
          labelBackgroundColor: '#C86F4A',
        },
      },
      rightPriceScale: {
        borderColor: '#E6DCCF',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#E6DCCF',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#6D7C3B',
      downColor: '#B04832',
      borderUpColor: '#6D7C3B',
      borderDownColor: '#B04832',
      wickUpColor: '#6D7C3B',
      wickDownColor: '#B04832',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Handle click for range selection
    chart.subscribeClick((param) => {
      if (!param.time) return;
      
      if (!selectionStart || (selectionStart && selectionEnd)) {
        // Start new selection
        setSelectionStart(param.time);
        setSelectionEnd(null);
        setIsSelecting(true);
      } else {
        // Complete selection
        setSelectionEnd(param.time);
        setIsSelecting(false);
        
        // Call onRangeSelect with the dates
        if (onRangeSelect) {
          const startDate = new Date(selectionStart * 1000);
          const endDate = new Date(param.time * 1000);
          
          // Ensure start is before end
          const [finalStart, finalEnd] = startDate < endDate 
            ? [startDate, endDate] 
            : [endDate, startDate];
          
          onRangeSelect({
            start: finalStart,
            end: finalEnd
          });
        }
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // Update data
  useEffect(() => {
    if (candleSeriesRef.current && data && data.length > 0) {
      candleSeriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  // Reset selection
  const resetSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
  }, []);

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="relative">
      {/* Selection info bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-4">
          {isSelecting && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#7A6A5C]">Başlangıç:</span>
              <span className="font-medium text-[#C86F4A]">{formatDate(selectionStart)}</span>
              <span className="text-[#7A6A5C]">→ Bitiş için tıklayın</span>
            </div>
          )}
          {selectionStart && selectionEnd && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-[#6D7C3B]/10 rounded text-[#6D7C3B] font-medium">
                {formatDate(selectionStart)}
              </span>
              <span className="text-[#7A6A5C]">→</span>
              <span className="px-2 py-1 bg-[#B04832]/10 rounded text-[#B04832] font-medium">
                {formatDate(selectionEnd)}
              </span>
            </div>
          )}
        </div>
        {(selectionStart || selectionEnd) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSelection}
            className="text-[#7A6A5C] hover:text-[#2E2620]"
          >
            Sıfırla
          </Button>
        )}
      </div>

      {/* Chart container */}
      <div 
        ref={chartContainerRef} 
        className="relative rounded-lg overflow-hidden border border-[#E6DCCF]"
        style={{ height: `${height}px` }}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#C86F4A]" />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-[#A89F91] text-center">
        💡 Grafik üzerinde başlangıç ve bitiş tarihlerini seçmek için tıklayın
      </div>
    </div>
  );
};

export default CandlestickChart;
