import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

const CandlestickChart = ({ 
  data, 
  loading, 
  onRangeSelect,
  height = 400 
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const onRangeSelectRef = useRef(onRangeSelect);
  const selectionStateRef = useRef({ start: null, end: null, isSelecting: false });
  const [displayState, setDisplayState] = useState({ start: null, end: null, isSelecting: false });

  // Keep onRangeSelect ref updated
  useEffect(() => {
    onRangeSelectRef.current = onRangeSelect;
  }, [onRangeSelect]);

  // Initialize chart only once
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: 'solid', color: '#FFFFFF' },
        textColor: '#2E2620',
        fontFamily: 'Manrope, sans-serif',
      },
      localization: {
        locale: 'tr-TR',
        dateFormat: 'dd/MM/yyyy',
      },
      grid: {
        vertLines: { color: '#E6DCCF', style: 1 },
        horzLines: { color: '#E6DCCF', style: 1 },
      },
      crosshair: {
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
        timeVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
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
      
      const clickTime = typeof param.time === 'object' 
        ? new Date(param.time.year, param.time.month - 1, param.time.day).getTime() / 1000
        : param.time;
      
      const currentState = selectionStateRef.current;
      
      if (!currentState.start || (currentState.start && currentState.end)) {
        // Start new selection
        selectionStateRef.current = { start: clickTime, end: null, isSelecting: true };
        setDisplayState({ start: clickTime, end: null, isSelecting: true });
      } else {
        // Complete selection
        const startTime = currentState.start;
        const endTime = clickTime;
        
        const [finalStart, finalEnd] = startTime < endTime 
          ? [startTime, endTime] 
          : [endTime, startTime];
        
        selectionStateRef.current = { start: finalStart, end: finalEnd, isSelecting: false };
        setDisplayState({ start: finalStart, end: finalEnd, isSelecting: false });
        
        // Call parent callback using ref to avoid stale closure
        if (onRangeSelectRef.current) {
          onRangeSelectRef.current({
            start: new Date(finalStart * 1000),
            end: new Date(finalEnd * 1000)
          });
        }
      }
    });

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
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
      }
    };
  }, [height]); // Only recreate on height change

  // Update data without recreating chart
  useEffect(() => {
    if (candleSeriesRef.current && data && data.length > 0) {
      candleSeriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  const resetSelection = useCallback(() => {
    selectionStateRef.current = { start: null, end: null, isSelecting: false };
    setDisplayState({ start: null, end: null, isSelecting: false });
  }, []);

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
      <div className="flex items-center justify-between mb-3 px-1 min-h-[32px]">
        <div className="flex items-center gap-4">
          {displayState.isSelecting && displayState.start && (
            <div className="flex items-center gap-2 text-sm animate-pulse">
              <span className="text-[#7A6A5C]">Başlangıç:</span>
              <span className="font-medium text-[#6D7C3B] px-2 py-1 bg-[#6D7C3B]/10 rounded">
                {formatDate(displayState.start)}
              </span>
              <span className="text-[#C86F4A] font-medium">→ Bitiş için grafikte tıklayın</span>
            </div>
          )}
          {!displayState.isSelecting && displayState.start && displayState.end && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#7A6A5C]">Seçilen:</span>
              <span className="px-2 py-1 bg-[#6D7C3B]/10 rounded text-[#6D7C3B] font-medium">
                {formatDate(displayState.start)}
              </span>
              <span className="text-[#7A6A5C]">→</span>
              <span className="px-2 py-1 bg-[#B04832]/10 rounded text-[#B04832] font-medium">
                {formatDate(displayState.end)}
              </span>
              <span className="text-xs text-[#6D7C3B] ml-2">✓ tarihlere uygulandı</span>
            </div>
          )}
          {!displayState.start && !displayState.isSelecting && (
            <span className="text-sm text-[#A89F91]">
              Grafik üzerinde tıklayarak tarih aralığı seçebilirsiniz
            </span>
          )}
        </div>
        {(displayState.start || displayState.end) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSelection}
            className="text-[#7A6A5C] hover:text-[#2E2620] text-xs"
          >
            Seçimi Sıfırla
          </Button>
        )}
      </div>

      <div 
        ref={chartContainerRef} 
        className="relative rounded-lg overflow-hidden border border-[#E6DCCF]"
        style={{ height: `${height}px`, cursor: 'crosshair' }}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#C86F4A]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CandlestickChart;
