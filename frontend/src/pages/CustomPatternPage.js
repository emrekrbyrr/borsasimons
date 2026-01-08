import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { ScrollArea } from '../components/ui/scroll-area';
import { Slider } from '../components/ui/slider';
import { toast } from 'sonner';
import { format, subYears } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  CalendarIcon,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Info,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../components/ui/tooltip';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomPatternPage = () => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [startDate, setStartDate] = useState(subYears(new Date(), 2));
  const [endDate, setEndDate] = useState(new Date());
  
  // Pattern criteria
  const [minRise1, setMinRise1] = useState([100]);
  const [maxRise1, setMaxRise1] = useState([160]);
  const [minDrop1, setMinDrop1] = useState([40]);
  const [maxDrop1, setMaxDrop1] = useState([60]);
  const [minRise2, setMinRise2] = useState([20]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/stocks/custom-pattern`,
        {
          pattern_criteria: {
            min_rise_1: minRise1[0],
            max_rise_1: maxRise1[0],
            min_drop_1: minDrop1[0],
            max_drop_1: maxDrop1[0],
            min_rise_2: minRise2[0]
          },
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          limit: 20
        },
        { headers: getAuthHeader() }
      );
      setResults(response.data);
      if (response.data.length === 0) {
        toast.info('Kriterlere uygun hisse bulunamadı');
      } else {
        toast.success(`${response.data.length} hisse bulundu`);
      }
    } catch (error) {
      toast.error('Arama yapılırken hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1EA]" data-testid="custom-pattern-page">
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E2620] font-['Playfair_Display']">
              Özel Kalıp Araması
            </h1>
            <p className="text-[#7A6A5C] mt-2">
              Kendi kriterlerinize göre dip-tepe kalıplarını arayın
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Criteria Form */}
            <div className="lg:col-span-1 space-y-6">
              {/* Date Range */}
              <Card className="card-organic" data-testid="date-range-card">
                <CardHeader>
                  <CardTitle className="font-['Playfair_Display'] text-[#2E2620] text-lg">
                    Tarih Aralığı
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#2E2620]">Başlangıç</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-[#E6DCCF] hover:bg-[#E8D9C7]/50"
                          data-testid="custom-start-date-btn"
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

                  <div className="space-y-2">
                    <Label className="text-[#2E2620]">Bitiş</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-[#E6DCCF] hover:bg-[#E8D9C7]/50"
                          data-testid="custom-end-date-btn"
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
                </CardContent>
              </Card>

              {/* Pattern Criteria */}
              <Card className="card-organic" data-testid="pattern-criteria-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-['Playfair_Display'] text-[#2E2620] text-lg">
                      Kalıp Kriterleri
                    </CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-[#7A6A5C]" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Bu kriterler dip-tepe noktalarını tespit etmek için kullanılır.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* First Rise */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[#2E2620] flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#6D7C3B]" />
                        1. Yükseliş
                      </Label>
                      <span className="text-sm text-[#7A6A5C]">
                        %{minRise1} - %{maxRise1}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#7A6A5C] w-8">Min</span>
                        <Slider
                          value={minRise1}
                          onValueChange={setMinRise1}
                          max={200}
                          min={50}
                          step={10}
                          className="[&_[role=slider]]:bg-[#6D7C3B]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#7A6A5C] w-8">Max</span>
                        <Slider
                          value={maxRise1}
                          onValueChange={setMaxRise1}
                          max={300}
                          min={100}
                          step={10}
                          className="[&_[role=slider]]:bg-[#6D7C3B]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* First Drop */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[#2E2620] flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-[#B04832]" />
                        1. Düşüş
                      </Label>
                      <span className="text-sm text-[#7A6A5C]">
                        %{minDrop1} - %{maxDrop1}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#7A6A5C] w-8">Min</span>
                        <Slider
                          value={minDrop1}
                          onValueChange={setMinDrop1}
                          max={80}
                          min={20}
                          step={5}
                          className="[&_[role=slider]]:bg-[#B04832]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#7A6A5C] w-8">Max</span>
                        <Slider
                          value={maxDrop1}
                          onValueChange={setMaxDrop1}
                          max={80}
                          min={30}
                          step={5}
                          className="[&_[role=slider]]:bg-[#B04832]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Second Rise */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[#2E2620] flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#6D7C3B]" />
                        2. Minimum Yükseliş
                      </Label>
                      <span className="text-sm text-[#7A6A5C]">%{minRise2}</span>
                    </div>
                    <Slider
                      value={minRise2}
                      onValueChange={setMinRise2}
                      max={100}
                      min={10}
                      step={5}
                      className="[&_[role=slider]]:bg-[#6D7C3B]"
                    />
                  </div>

                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full py-6"
                    data-testid="custom-search-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Aranıyor...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Hisse Ara
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="card-organic bg-[#C86F4A]/5 border-[#C86F4A]/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#C86F4A] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[#7A6A5C]">
                      <p className="font-medium text-[#2E2620] mb-1">Kalıp Açıklaması</p>
                      <p>
                        Bu arama, belirtilen kriterlere uygun dip ve tepe noktalarına sahip 
                        hisseleri BIST 100 içinden bulur. İlk yükseliş ve düşüş oranlarını 
                        ayarlayarak arama kriterlerinizi özelleştirebilirsiniz.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              <Card className="card-organic" data-testid="results-card">
                <CardHeader>
                  <CardTitle className="font-['Playfair_Display'] text-[#2E2620]">
                    Sonuçlar
                  </CardTitle>
                  <CardDescription className="text-[#7A6A5C]">
                    {results.length > 0 
                      ? `${results.length} hisse kriterlere uyuyor`
                      : 'Arama sonuçları burada görünecek'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-[#E6DCCF] mx-auto mb-4" />
                      <p className="text-[#7A6A5C]">
                        Kriterleri ayarlayın ve "Hisse Ara" butonuna tıklayın
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        {results.map((stock, index) => (
                          <div
                            key={stock.symbol}
                            className="p-4 rounded-xl border border-[#E6DCCF] hover:border-[#C86F4A]/30 hover:shadow-md transition-all"
                            data-testid={`result-${stock.symbol}`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-[#2E2620]">
                                  {stock.symbol}
                                </h3>
                                <p className="text-sm text-[#7A6A5C]">
                                  {stock.matching_criteria_count} kriter eşleşmesi
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-[#2E2620]">
                                  ₺{stock.current_price?.toLocaleString('tr-TR')}
                                </p>
                                <p className={`text-sm ${
                                  stock.price_change_percent >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'
                                }`}>
                                  {stock.price_change_percent >= 0 ? '+' : ''}
                                  {stock.price_change_percent?.toFixed(2)}%
                                </p>
                              </div>
                            </div>

                            {/* Peak/Trough points */}
                            {stock.peaks_troughs?.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {stock.peaks_troughs.slice(0, 6).map((pt, i) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded-lg text-sm ${
                                      pt.point_type === 'tepe'
                                        ? 'bg-[#6D7C3B]/5 border border-[#6D7C3B]/20'
                                        : 'bg-[#B04832]/5 border border-[#B04832]/20'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1 mb-1">
                                      {pt.point_type === 'tepe' ? (
                                        <TrendingUp className="w-3 h-3 text-[#6D7C3B]" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3 text-[#B04832]" />
                                      )}
                                      <span className="font-medium text-[#2E2620]">
                                        {pt.point_number}. {pt.point_type === 'tepe' ? 'Tepe' : 'Dip'}
                                      </span>
                                    </div>
                                    <p className="text-[#7A6A5C] text-xs">{pt.date}</p>
                                    <p className="text-[#2E2620] font-medium">
                                      ₺{pt.price?.toLocaleString('tr-TR')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomPatternPage;
