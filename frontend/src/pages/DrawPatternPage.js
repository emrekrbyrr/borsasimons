import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AnalysisCandlestickChart from '../components/AnalysisCandlestickChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import {
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  ChevronsUpDown,
  Check,
  MousePointer2,
  Undo2,
  GitCompare
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DrawPatternPage = () => {
  const { getAuthHeader } = useAuth();
  
  // Stock selection
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [symbolsOpen, setSymbolsOpen] = useState(false);
  
  // Chart data
  const [candleData, setCandleData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  
  // Drawing mode
  const [drawingMode, setDrawingMode] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState([]); // [{time, price, type: 'dip'|'tepe'}]
  const [nextPointType, setNextPointType] = useState('dip'); // Alternates between dip and tepe
  
  // Search
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  
  // Comparison modal states
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareStock, setCompareStock] = useState(null);
  const [compareCandleData, setCompareCandleData] = useState([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [refCandleData, setRefCandleData] = useState([]);
  const [refLoading, setRefLoading] = useState(false);
  
  // Chart refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const markersRef = useRef([]);
  
  // Refs for click handler (to avoid stale closures)
  const drawingModeRef = useRef(drawingMode);
  const candleDataRef = useRef(candleData);
  const handlePointSelectRef = useRef(null);

  // Fetch symbols on mount
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await axios.get(`${API_URL}/stocks/symbols`, {
          headers: getAuthHeader()
        });
        setSymbols(response.data.symbols || []);
      } catch (error) {
        console.error('Error fetching symbols:', error);
      }
    };
    fetchSymbols();
  }, [getAuthHeader]);

  // Fetch candlestick data when symbol changes
  useEffect(() => {
    if (!selectedSymbol) return;
    
    const fetchCandleData = async () => {
      setChartLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/stocks/${selectedSymbol}/candlestick?interval=1d&period=2y`,
          { headers: getAuthHeader() }
        );
        setCandleData(response.data.candles || []);
        // Clear selected points when symbol changes
        setSelectedPoints([]);
        setNextPointType('dip');
      } catch (error) {
        toast.error('Grafik verisi yüklenemedi');
        console.error(error);
      } finally {
        setChartLoading(false);
      }
    };
    fetchCandleData();
  }, [selectedSymbol, getAuthHeader]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
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
        mode: 1,
        vertLine: { color: '#C86F4A', width: 1, style: 2, labelBackgroundColor: '#C86F4A' },
        horzLine: { color: '#C86F4A', width: 1, style: 2, labelBackgroundColor: '#C86F4A' },
      },
      rightPriceScale: { borderColor: '#E6DCCF' },
      timeScale: { borderColor: '#E6DCCF', timeVisible: false },
      localization: {
        locale: 'tr-TR',
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

    // Line series for connecting selected points
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#C86F4A',
      lineWidth: 2,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    lineSeriesRef.current = lineSeries;

    // Handle click on chart
    chart.subscribeClick((param) => {
      if (!drawingModeRef.current || !param.time || !param.point) return;
      
      // Get the exact price at the clicked Y coordinate
      const clickedPrice = candleSeries.coordinateToPrice(param.point.y);
      if (!clickedPrice) return;
      
      const clickTime = param.time;
      
      if (handlePointSelectRef.current) {
        handlePointSelectRef.current(clickTime, clickedPrice);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        lineSeriesRef.current = null;
      }
    };
  }, []);

  // Update candle data
  useEffect(() => {
    if (candleSeriesRef.current && candleData.length > 0) {
      candleSeriesRef.current.setData(candleData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [candleData]);

  // Update line and markers when points change
  useEffect(() => {
    if (!lineSeriesRef.current || !candleSeriesRef.current) return;

    // Update line series - MUST be sorted by time ascending
    if (selectedPoints.length > 0) {
      const lineData = selectedPoints
        .map(p => ({ time: p.time, value: p.price }))
        .sort((a, b) => a.time - b.time);  // Sort by time ascending
      lineSeriesRef.current.setData(lineData);
    } else {
      lineSeriesRef.current.setData([]);
    }

    // Update markers on candle series
    // Note: We need to create custom markers using primitives or overlays
    // For now, we'll just show the line connecting points
  }, [selectedPoints]);

  const handlePointSelect = useCallback((time, price) => {
    // Round price to 2 decimal places
    const roundedPrice = Math.round(price * 100) / 100;
    
    setSelectedPoints(prev => {
      const newPoint = {
        time,
        price: roundedPrice,
        type: nextPointType,
        index: prev.length + 1
      };
      return [...prev, newPoint];
    });
    
    // Alternate point type
    setNextPointType(prev => prev === 'dip' ? 'tepe' : 'dip');
    
    toast.success(`${nextPointType === 'dip' ? 'Dip' : 'Tepe'} noktası eklendi: ₺${roundedPrice.toLocaleString('tr-TR')}`);
  }, [nextPointType]);

  // Update refs when values change
  useEffect(() => {
    drawingModeRef.current = drawingMode;
  }, [drawingMode]);

  useEffect(() => {
    candleDataRef.current = candleData;
  }, [candleData]);

  useEffect(() => {
    handlePointSelectRef.current = handlePointSelect;
  }, [handlePointSelect]);

  const handleUndo = () => {
    if (selectedPoints.length === 0) return;
    
    setSelectedPoints(prev => prev.slice(0, -1));
    setNextPointType(prev => prev === 'dip' ? 'tepe' : 'dip');
    toast.info('Son nokta silindi');
  };

  const handleClearAll = () => {
    setSelectedPoints([]);
    setNextPointType('dip');
    if (lineSeriesRef.current) {
      lineSeriesRef.current.setData([]);
    }
    toast.info('Tüm noktalar silindi');
  };

  const calculateRatios = () => {
    if (selectedPoints.length < 2) return [];
    
    // Sort points by time for correct ratio calculation
    const sortedPoints = [...selectedPoints].sort((a, b) => a.time - b.time);
    
    const ratios = [];
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];
      const change = ((p2.price - p1.price) / p1.price) * 100;
      ratios.push({
        from: `${p1.type === 'dip' ? 'Dip' : 'Tepe'}`,
        to: `${p2.type === 'dip' ? 'Dip' : 'Tepe'}`,
        change: change.toFixed(2),
        isRise: change > 0
      });
    }
    return ratios;
  };

  const handleSearch = async () => {
    if (selectedPoints.length < 2) {
      toast.error('En az 2 nokta seçmelisiniz');
      return;
    }

    setSearching(true);
    try {
      // Calculate criteria from selected points
      const criteria = {};
      const ratios = calculateRatios();
      
      ratios.forEach((ratio, idx) => {
        const absChange = Math.abs(parseFloat(ratio.change));
        const minChange = Math.max(5, absChange - 15);
        const maxChange = absChange + 15;
        
        if (ratio.isRise) {
          criteria[`rise_${idx + 1}_min`] = minChange;
          criteria[`rise_${idx + 1}_max`] = maxChange;
        } else {
          criteria[`drop_${idx + 1}_min`] = minChange;
          criteria[`drop_${idx + 1}_max`] = maxChange;
        }
      });

      const response = await axios.post(
        `${API_URL}/stocks/search-by-pattern`,
        {
          symbol: selectedSymbol,
          points: selectedPoints.map(p => ({
            time: p.time,
            price: p.price,
            type: p.type
          })),
          criteria,
          min_similarity: 0.6,
          limit: 20
        },
        { headers: getAuthHeader() }
      );

      setResults(response.data);
      if (response.data.length === 0) {
        toast.info('Benzer kalıp bulunamadı');
      } else {
        toast.success(`${response.data.length} benzer kalıp bulundu`);
      }
    } catch (error) {
      // Fallback to find-similar endpoint
      try {
        const firstPoint = selectedPoints[0];
        const lastPoint = selectedPoints[selectedPoints.length - 1];
        
        const startDate = new Date(firstPoint.time * 1000).toISOString().split('T')[0];
        const endDate = new Date(lastPoint.time * 1000).toISOString().split('T')[0];
        
        const response = await axios.post(
          `${API_URL}/stocks/find-similar`,
          {
            symbol: selectedSymbol,
            start_date: startDate,
            end_date: endDate,
            min_similarity: 0.6,
            limit: 20
          },
          { headers: getAuthHeader() }
        );
        
        setResults(response.data);
        if (response.data.length === 0) {
          toast.info('Benzer kalıp bulunamadı');
        } else {
          toast.success(`${response.data.length} benzer kalıp bulundu`);
        }
      } catch (e) {
        toast.error('Arama yapılırken hata oluştu');
        console.error(e);
      }
    } finally {
      setSearching(false);
    }
  };

  const ratios = calculateRatios();

  return (
    <div className="min-h-screen bg-[#F6F1EA]" data-testid="draw-pattern-page">
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E2620] font-['Playfair_Display']">
              Grafik Üzerinde Kalıp Çizimi
            </h1>
            <p className="text-[#7A6A5C] mt-2">
              Bir hisse seçin, grafikte dip ve tepe noktalarını tıklayarak işaretleyin
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Controls */}
            <div className="space-y-4">
              {/* Stock Selection */}
              <Card className="card-organic">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-['Playfair_Display'] text-[#2E2620]">
                    Hisse Seçimi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover open={symbolsOpen} onOpenChange={setSymbolsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={symbolsOpen}
                        className="w-full justify-between border-[#E6DCCF] hover:bg-[#E8D9C7]/50"
                        data-testid="draw-symbol-select"
                      >
                        {selectedSymbol || "Hisse seçin..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Hisse ara..." data-testid="draw-symbol-search" />
                        <CommandList>
                          <CommandEmpty>Hisse bulunamadı</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {symbols.map((symbol) => (
                                <CommandItem
                                  key={symbol}
                                  value={symbol}
                                  onSelect={() => {
                                    setSelectedSymbol(symbol);
                                    setSymbolsOpen(false);
                                  }}
                                >
                                  <Check className={`mr-2 h-4 w-4 ${selectedSymbol === symbol ? "opacity-100" : "opacity-0"}`} />
                                  {symbol}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              {/* Drawing Controls */}
              <Card className="card-organic">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-['Playfair_Display'] text-[#2E2620]">
                    Çizim Kontrolleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setDrawingMode(!drawingMode)}
                    variant={drawingMode ? "default" : "outline"}
                    className={`w-full ${drawingMode ? 'bg-[#C86F4A] hover:bg-[#B05D3A]' : 'border-[#C86F4A] text-[#C86F4A] hover:bg-[#C86F4A]/10'}`}
                    data-testid="toggle-draw-mode"
                  >
                    {drawingMode ? (
                      <>
                        <MousePointer2 className="w-4 h-4 mr-2" />
                        Çizim Modu Aktif
                      </>
                    ) : (
                      <>
                        <Pencil className="w-4 h-4 mr-2" />
                        Çizim Modunu Aç
                      </>
                    )}
                  </Button>
                  
                  {drawingMode && (
                    <div className="p-3 rounded-lg bg-[#C86F4A]/10 border border-[#C86F4A]/20">
                      <p className="text-sm text-[#C86F4A] font-medium">
                        Sıradaki: {selectedPoints.length + 1}. {nextPointType === 'dip' ? 'Dip' : 'Tepe'}
                      </p>
                      <p className="text-xs text-[#7A6A5C] mt-1">
                        Grafikte bir muma tıklayın
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUndo}
                      variant="outline"
                      className="flex-1 border-[#E6DCCF]"
                      disabled={selectedPoints.length === 0}
                      data-testid="undo-point"
                    >
                      <Undo2 className="w-4 h-4 mr-1" />
                      Geri Al
                    </Button>
                    <Button
                      onClick={handleClearAll}
                      variant="outline"
                      className="flex-1 border-[#E6DCCF] text-[#B04832] hover:bg-[#B04832]/10"
                      disabled={selectedPoints.length === 0}
                      data-testid="clear-points"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Temizle
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Points */}
              <Card className="card-organic">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-['Playfair_Display'] text-[#2E2620]">
                    Seçilen Noktalar ({selectedPoints.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPoints.length === 0 ? (
                    <p className="text-sm text-[#7A6A5C] text-center py-4">
                      Henüz nokta seçilmedi
                    </p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {selectedPoints.map((point, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-sm flex items-center justify-between ${
                              point.type === 'dip'
                                ? 'bg-[#B04832]/10 border border-[#B04832]/20'
                                : 'bg-[#6D7C3B]/10 border border-[#6D7C3B]/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {point.type === 'dip' ? (
                                <TrendingDown className="w-4 h-4 text-[#B04832]" />
                              ) : (
                                <TrendingUp className="w-4 h-4 text-[#6D7C3B]" />
                              )}
                              <span className="font-medium">
                                {point.index}. {point.type === 'dip' ? 'Dip' : 'Tepe'}
                              </span>
                            </div>
                            <span className="text-[#2E2620] font-medium">
                              ₺{point.price?.toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Calculated Ratios */}
              {ratios.length > 0 && (
                <Card className="card-organic">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-['Playfair_Display'] text-[#2E2620]">
                      Hesaplanan Oranlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ratios.map((ratio, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-[#F6F1EA] flex items-center justify-between"
                        >
                          <span className="text-sm text-[#7A6A5C]">
                            {ratio.from} → {ratio.to}
                          </span>
                          <span className={`text-sm font-medium ${ratio.isRise ? 'text-[#6D7C3B]' : 'text-[#B04832]'}`}>
                            {ratio.isRise ? '+' : ''}{ratio.change}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={searching || selectedPoints.length < 2}
                className="w-full bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full py-6"
                data-testid="search-pattern-btn"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Aranıyor...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Benzer Kalıpları Bul
                  </>
                )}
              </Button>
            </div>

            {/* Right Panel - Chart & Results */}
            <div className="lg:col-span-3 space-y-6">
              {/* Chart */}
              <Card className="card-organic">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-['Playfair_Display'] text-[#2E2620]">
                        {selectedSymbol || 'Hisse Seçin'}
                      </CardTitle>
                      <CardDescription className="text-[#7A6A5C]">
                        {drawingMode ? 'Çizim modu aktif - Grafikte tıklayarak nokta ekleyin' : 'Çizim modunu açın ve noktaları işaretleyin'}
                      </CardDescription>
                    </div>
                    {drawingMode && (
                      <Badge className="bg-[#C86F4A]/10 text-[#C86F4A] border-[#C86F4A]/30">
                        Çizim Modu
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={chartContainerRef}
                    className={`relative rounded-lg overflow-hidden border ${drawingMode ? 'border-[#C86F4A] cursor-crosshair' : 'border-[#E6DCCF]'}`}
                    style={{ height: '500px' }}
                  >
                    {chartLoading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-[#C86F4A]" />
                      </div>
                    )}
                    {!selectedSymbol && !chartLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#F6F1EA]/50">
                        <p className="text-[#7A6A5C]">Sol panelden bir hisse seçin</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {results.length > 0 && (
                <Card className="card-organic">
                  <CardHeader>
                    <CardTitle className="font-['Playfair_Display'] text-[#2E2620]">
                      Benzer Kalıplar ({results.length})
                    </CardTitle>
                    <CardDescription className="text-[#7A6A5C]">
                      Çizdiğiniz kalıba benzer hareket yapmış hisseler
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {results.map((stock, idx) => (
                          <div
                            key={stock.symbol}
                            className="p-4 rounded-lg border border-[#E6DCCF] hover:border-[#C86F4A]/30 transition-all"
                            data-testid={`result-${stock.symbol}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#2E2620]">{stock.symbol}</span>
                                  <Badge className="bg-[#6D7C3B]/10 text-[#6D7C3B] border-[#6D7C3B]/30">
                                    {stock.similarity_score}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-[#7A6A5C] mt-1">
                                  {stock.start_date} → {stock.end_date}
                                </p>
                                {/* After pattern info */}
                                {(stock.after_pattern_1m !== null || stock.after_pattern_3m !== null) && (
                                  <div className="flex gap-3 mt-1">
                                    {stock.after_pattern_1m !== null && (
                                      <span className={`text-xs font-medium ${stock.after_pattern_1m >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'}`}>
                                        1A: {stock.after_pattern_1m >= 0 ? '+' : ''}{stock.after_pattern_1m}%
                                      </span>
                                    )}
                                    {stock.after_pattern_3m !== null && (
                                      <span className={`text-xs font-medium ${stock.after_pattern_3m >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'}`}>
                                        3A: {stock.after_pattern_3m >= 0 ? '+' : ''}{stock.after_pattern_3m}%
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-[#2E2620]">
                                  ₺{stock.current_price?.toLocaleString('tr-TR')}
                                </p>
                                <p className={`text-sm ${stock.price_change_percent >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'}`}>
                                  {stock.price_change_percent >= 0 ? '+' : ''}{stock.price_change_percent?.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DrawPatternPage;
