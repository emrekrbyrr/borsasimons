import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import { Loader2 } from 'lucide-react';

const AnalysisCandlestickChart = ({ 
  data, 
  loading, 
  peaksTroughs = [],
  height = 400 
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const markersApiRef = useRef(null);

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
        markersApiRef.current = null;
      }
    };
  }, [height]);

  // Update data and markers
  useEffect(() => {
    if (candleSeriesRef.current && data && data.length > 0) {
      candleSeriesRef.current.setData(data);
      
      // Add markers for peaks and troughs using v5 API
      if (peaksTroughs && peaksTroughs.length > 0) {
        const markers = peaksTroughs.map(pt => {
          // Find the timestamp for this date
          const dateStr = pt.date;
          const candle = data.find(c => {
            const candleDate = new Date(c.time * 1000).toISOString().split('T')[0];
            return candleDate === dateStr;
          });
          
          if (!candle) return null;
          
          return {
            time: candle.time,
            position: pt.point_type === 'tepe' ? 'aboveBar' : 'belowBar',
            color: pt.point_type === 'tepe' ? '#6D7C3B' : '#B04832',
            shape: pt.point_type === 'tepe' ? 'arrowDown' : 'arrowUp',
            text: `${pt.point_number}. ${pt.point_type === 'tepe' ? 'T' : 'D'}`,
          };
        }).filter(Boolean);
        
        // Use createSeriesMarkers API for v5
        if (markersApiRef.current) {
          markersApiRef.current.setMarkers(markers);
        } else if (markers.length > 0) {
          markersApiRef.current = createSeriesMarkers(candleSeriesRef.current, markers);
        }
      } else if (markersApiRef.current) {
        markersApiRef.current.setMarkers([]);
      }
      
      chartRef.current?.timeScale().fitContent();
    }
  }, [data, peaksTroughs]);

  return (
    <div className="relative">
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
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-[#6D7C3B]" />
          <span className="text-sm text-[#7A6A5C]">Tepe Noktası</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#B04832]" />
          <span className="text-sm text-[#7A6A5C]">Dip Noktası</span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCandlestickChart;
