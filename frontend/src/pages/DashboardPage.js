import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { toast } from 'sonner';
import { format, subYears } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  CalendarIcon,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowRight,
  Loader2,
  Check,
  ChevronsUpDown
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
      // Backend'den zaten alfabetik sıralı geliyor
      setSymbols(response.data.symbols);
    } catch (error) {
      toast.error('Semboller yüklenemedi');
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
                {/* Symbol Select */}
                <div className="space-y-2">
                  <Label className="text-[#2E2620]">Hisse Senedi</Label>
                  <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
                    <SelectTrigger 
                      className="border-[#E6DCCF] focus:border-[#C86F4A] focus:ring-[#C86F4A]/20"
                      data-testid="symbol-select"
                    >
                      <SelectValue placeholder="Hisse seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {symbols.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label className="text-[#2E2620]">Başlangıç Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border-[#E6DCCF] hover:bg-[#E8D9C7]/50"
                        data-testid="start-date-btn"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#7A6A5C]" />
                        {startDate ? format(startDate, 'dd MMM yyyy', { locale: tr }) : 'Tarih seçin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label className="text-[#2E2620]">Bitiş Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border-[#E6DCCF] hover:bg-[#E8D9C7]/50"
                        data-testid="end-date-btn"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#7A6A5C]" />
                        {endDate ? format(endDate, 'dd MMM yyyy', { locale: tr }) : 'Tarih seçin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
