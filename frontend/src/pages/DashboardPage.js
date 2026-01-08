import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import CandlestickChart from '../components/CandlestickChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { format, subYears } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowRight,
  Loader2,
  Check,
  ChevronsUpDown,
  CandlestickChart as CandleIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [startDate, setStartDate] = useState(subYears(new Date(), 2));
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [quickStats, setQuickStats] = useState(null);
  const [symbolSearchOpen, setSymbolSearchOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  
  // Candlestick chart states
  const [candleData, setCandleData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [timeInterval, setTimeInterval] = useState('1d');
  const [chartPeriod, setChartPeriod] = useState('2y');

  useEffect(() => {
    fetchSymbols();
  }, []);

  // Filtrelenmiş semboller (yazılan metne göre)
  const filteredSymbols = useMemo(() => {
    if (!symbolSearch) return symbols;
    const search = symbolSearch.toUpperCase();
    return symbols.filter(s => s.startsWith(search) || s.includes(search));
  }, [symbols, symbolSearch]);

  const fetchSymbols = async () => {
    try {
      const response = await axios.get(`${API_URL}/stocks/symbols`, {
        headers: getAuthHeader()
      });
      setSymbols(response.data.symbols);
    } catch (error) {
      toast.error('Semboller yüklenemedi');
    }
  };

  const fetchCandlestickData = async (symbol, interval = timeInterval, period = chartPeriod) => {
    if (!symbol) return;
    setChartLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/stocks/${symbol}/candlestick?interval=${interval}&period=${period}`,
        { headers: getAuthHeader() }
      );
      setCandleData(response.data.candles);
    } catch (error) {
      console.error('Candlestick error:', error);
      toast.error('Grafik verisi yüklenemedi');
    } finally {
      setChartLoading(false);
    }
  };

  const fetchQuickStats = async (symbol) => {
    if (!symbol) return;
    try {
      const response = await axios.get(`${API_URL}/stocks/${symbol}/quick`, {
        headers: getAuthHeader()
      });
      setQuickStats(response.data);
    } catch (error) {
      console.error('Quick stats error:', error);
    }
  };

  const handleSymbolChange = (value) => {
    setSelectedSymbol(value);
    fetchQuickStats(value);
    fetchCandlestickData(value);
  };

  const handleIntervalChange = (interval) => {
    setTimeInterval(interval);
    if (selectedSymbol) {
      fetchCandlestickData(selectedSymbol, interval, chartPeriod);
    }
  };

  const handlePeriodChange = (period) => {
    setChartPeriod(period);
    if (selectedSymbol) {
      fetchCandlestickData(selectedSymbol, timeInterval, period);
    }
  };

  const handleRangeSelect = (range) => {
    setStartDate(range.start);
    setEndDate(range.end);
    toast.success(`Tarih aralığı seçildi: ${format(range.start, 'dd MMM yyyy', { locale: tr })} - ${format(range.end, 'dd MMM yyyy', { locale: tr })}`);
  };

  const handleAnalyze = () => {
    if (!selectedSymbol) {
      toast.error('Lütfen bir hisse seçin');
      return;
    }
    
    navigate('/analysis', {
      state: {
        symbol: selectedSymbol,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F1EA]" data-testid="dashboard-page">
      <Sidebar />
      
      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E2620] font-['Playfair_Display']">
              Dashboard
            </h1>
            <p className="text-[#7A6A5C] mt-2">
              BIST 100 hisselerinde benzer kalıpları keşfedin
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-organic animate-slide-up stagger-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C86F4A]/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-[#C86F4A]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#7A6A5C]">BIST</p>
                    <p className="text-2xl font-bold text-[#2E2620]">{symbols.length}</p>
                    <p className="text-xs text-[#7A6A5C]">Takip Edilen Hisse</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-organic animate-slide-up stagger-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#6D7C3B]/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-[#6D7C3B]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#7A6A5C]">Analiz Türü</p>
                    <p className="text-2xl font-bold text-[#2E2620]">DTW</p>
                    <p className="text-xs text-[#7A6A5C]">Benzerlik Algoritması</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-organic animate-slide-up stagger-3">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C86F4A]/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#C86F4A]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#7A6A5C]">Tepe Noktası</p>
                    <p className="text-2xl font-bold text-[#2E2620]">5</p>
                    <p className="text-xs text-[#7A6A5C]">Maksimum Tespit</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-organic animate-slide-up stagger-4">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#B04832]/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-[#B04832]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#7A6A5C]">Dip Noktası</p>
                    <p className="text-2xl font-bold text-[#2E2620]">6</p>
                    <p className="text-xs text-[#7A6A5C]">Maksimum Tespit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Analysis Card */}
          <Card className="card-organic animate-slide-up" data-testid="analysis-form-card">
            <CardHeader>
              <CardTitle className="text-2xl font-['Playfair_Display'] text-[#2E2620]">
                Yeni Analiz Başlat
              </CardTitle>
              <CardDescription className="text-[#7A6A5C]">
                Analiz etmek istediğiniz hisseyi ve tarih aralığını seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Symbol Select - Searchable Combobox */}
                <div className="space-y-2">
                  <Label className="text-[#2E2620]">Hisse Senedi</Label>
                  <Popover open={symbolSearchOpen} onOpenChange={setSymbolSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={symbolSearchOpen}
                        className="w-full justify-between border-[#E6DCCF] hover:bg-[#E8D9C7]/50"
                        data-testid="symbol-select"
                      >
                        {selectedSymbol || "Hisse ara..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Hisse ara (örn: THY, GAR)..." 
                          value={symbolSearch}
                          onValueChange={setSymbolSearch}
                          data-testid="symbol-search-input"
                        />
                        <CommandList>
                          <CommandEmpty>Hisse bulunamadı.</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-auto">
                            {filteredSymbols.slice(0, 50).map((symbol) => (
                              <CommandItem
                                key={symbol}
                                value={symbol}
                                onSelect={() => {
                                  handleSymbolChange(symbol);
                                  setSymbolSearchOpen(false);
                                  setSymbolSearch('');
                                }}
                                data-testid={`symbol-option-${symbol}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSymbol === symbol ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {symbol}
                              </CommandItem>
                            ))}
                            {filteredSymbols.length > 50 && (
                              <div className="p-2 text-xs text-center text-[#7A6A5C]">
                                +{filteredSymbols.length - 50} daha... (aramayı daraltın)
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Interval */}
                <div className="space-y-2">
                  <Label className="text-[#2E2620]">Zaman Dilimi</Label>
                  <Select value={timeInterval} onValueChange={handleIntervalChange}>
                    <SelectTrigger className="border-[#E6DCCF]" data-testid="interval-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 Saatlik</SelectItem>
                      <SelectItem value="4h">4 Saatlik</SelectItem>
                      <SelectItem value="1d">Günlük</SelectItem>
                      <SelectItem value="1wk">Haftalık</SelectItem>
                      <SelectItem value="1mo">Aylık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Period */}
                <div className="space-y-2">
                  <Label className="text-[#2E2620]">Periyot</Label>
                  <Select value={chartPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="border-[#E6DCCF]" data-testid="period-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3mo">3 Ay</SelectItem>
                      <SelectItem value="6mo">6 Ay</SelectItem>
                      <SelectItem value="1y">1 Yıl</SelectItem>
                      <SelectItem value="2y">2 Yıl</SelectItem>
                      <SelectItem value="5y">5 Yıl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Candlestick Chart */}
              {selectedSymbol && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CandleIcon className="w-5 h-5 text-[#C86F4A]" />
                      <h3 className="font-medium text-[#2E2620]">{selectedSymbol} Grafiği</h3>
                      {quickStats && (
                        <span className={`text-sm font-medium ${quickStats.change_percent >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'}`}>
                          ₺{quickStats.current_price?.toLocaleString('tr-TR')} ({quickStats.change_percent >= 0 ? '+' : ''}{quickStats.change_percent?.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <CandlestickChart
                    data={candleData}
                    loading={chartLoading}
                    onRangeSelect={handleRangeSelect}
                    height={350}
                  />
                </div>
              )}

              {/* Selected Date Range & Analyze Button */}
              <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-[#F6F1EA] rounded-lg border border-[#E6DCCF]">
                    <span className="text-xs text-[#7A6A5C]">Başlangıç</span>
                    <p className="font-medium text-[#2E2620]">{format(startDate, 'dd MMM yyyy', { locale: tr })}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#7A6A5C]" />
                  <div className="px-4 py-2 bg-[#F6F1EA] rounded-lg border border-[#E6DCCF]">
                    <span className="text-xs text-[#7A6A5C]">Bitiş</span>
                    <p className="font-medium text-[#2E2620]">{format(endDate, 'dd MMM yyyy', { locale: tr })}</p>
                  </div>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedSymbol || loading}
                  className="bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full px-8"
                  data-testid="analyze-btn"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Analiz Et
                </Button>
              </div>
            </CardContent>
          </Card>
                </div>

                {/* Analyze Button */}
                <div className="flex items-end">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedSymbol || loading}
                    className="w-full bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full py-6"
                    data-testid="analyze-btn"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Analiz Et
                  </Button>
                </div>
              </div>

              {/* Quick Stats Preview */}
              {quickStats && (
                <div className="mt-6 p-4 bg-[#F6F1EA] rounded-xl border border-[#E6DCCF]">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="font-medium text-[#2E2620]">{quickStats.symbol}</h3>
                      <p className="text-sm text-[#7A6A5C]">{quickStats.name}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-[#7A6A5C]">Güncel Fiyat</p>
                        <p className="text-xl font-bold text-[#2E2620]">
                          ₺{quickStats.current_price?.toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#7A6A5C]">Değişim</p>
                        <p className={`text-xl font-bold ${
                          quickStats.change_percent >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'
                        }`}>
                          {quickStats.change_percent >= 0 ? '+' : ''}{quickStats.change_percent?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card 
              className="card-organic card-interactive animate-slide-up stagger-3"
              onClick={() => navigate('/custom-pattern')}
              data-testid="custom-pattern-card"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2E2620] font-['Playfair_Display'] mb-2">
                      Özel Kalıp Araması
                    </h3>
                    <p className="text-[#7A6A5C] text-sm mb-4">
                      Kendi kriterlerinizi girerek özel dip-tepe kalıplarına uyan hisseleri bulun
                    </p>
                    <div className="flex items-center text-[#C86F4A] text-sm font-medium">
                      <span>Özel arama yap</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#C86F4A]/10 flex items-center justify-center flex-shrink-0">
                    <Search className="w-6 h-6 text-[#C86F4A]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="card-organic card-interactive animate-slide-up stagger-4"
              onClick={() => navigate('/saved')}
              data-testid="saved-analyses-card"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2E2620] font-['Playfair_Display'] mb-2">
                      Kayıtlı Analizler
                    </h3>
                    <p className="text-[#7A6A5C] text-sm mb-4">
                      Daha önce yaptığınız analizlere tekrar erişin ve karşılaştırın
                    </p>
                    <div className="flex items-center text-[#6D7C3B] text-sm font-medium">
                      <span>Analizleri görüntüle</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#6D7C3B]/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-[#6D7C3B]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
