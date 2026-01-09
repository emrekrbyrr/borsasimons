import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { ScrollArea } from '../components/ui/scroll-area';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
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
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API_URL = `${BACKEND_URL}/api`;

const CustomPatternPage = () => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [startDate, setStartDate] = useState(subYears(new Date(), 2));
  const [endDate, setEndDate] = useState(new Date());
  const [minPointsMatch, setMinPointsMatch] = useState([4]);
  
  // Tüm dip/tepe kriterleri
  const [criteria, setCriteria] = useState({
    // 1. Dip -> 1. Tepe yükseliş
    rise_1_min: [100],
    rise_1_max: [160],
    // 1. Tepe -> 2. Dip düşüş
    drop_1_min: [40],
    drop_1_max: [60],
    // 2. Dip -> 2. Tepe yükseliş
    rise_2_min: [20],
    rise_2_max: [50],
    // 2. Tepe -> 3. Dip düşüş
    drop_2_min: [20],
    drop_2_max: [30],
    // 3. Dip -> 3. Tepe yükseliş
    rise_3_min: [15],
    rise_3_max: [40],
    // 3. Tepe -> 4. Dip düşüş
    drop_3_min: [15],
    drop_3_max: [30],
    // 4. Dip -> 4. Tepe yükseliş
    rise_4_min: [10],
    rise_4_max: [30],
    // 4. Tepe -> 5. Dip düşüş
    drop_4_min: [10],
    drop_4_max: [25],
    // 5. Dip -> 5. Tepe yükseliş
    rise_5_min: [5],
    rise_5_max: [20],
    // 5. Tepe -> 6. Dip düşüş
    drop_5_min: [10],
    drop_5_max: [40],
  });

  const updateCriteria = (key, value) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/stocks/advanced-pattern`,
        {
          criteria: {
            rise_1_min: criteria.rise_1_min[0],
            rise_1_max: criteria.rise_1_max[0],
            drop_1_min: criteria.drop_1_min[0],
            drop_1_max: criteria.drop_1_max[0],
            rise_2_min: criteria.rise_2_min[0],
            rise_2_max: criteria.rise_2_max[0],
            drop_2_min: criteria.drop_2_min[0],
            drop_2_max: criteria.drop_2_max[0],
            rise_3_min: criteria.rise_3_min[0],
            rise_3_max: criteria.rise_3_max[0],
            drop_3_min: criteria.drop_3_min[0],
            drop_3_max: criteria.drop_3_max[0],
            rise_4_min: criteria.rise_4_min[0],
            rise_4_max: criteria.rise_4_max[0],
            drop_4_min: criteria.drop_4_min[0],
            drop_4_max: criteria.drop_4_max[0],
            rise_5_min: criteria.rise_5_min[0],
            rise_5_max: criteria.rise_5_max[0],
            drop_5_min: criteria.drop_5_min[0],
            drop_5_max: criteria.drop_5_max[0],
          },
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          min_points_match: minPointsMatch[0],
          limit: 30
        },
        { headers: getAuthHeader() }
      );
      setResults(response.data);
      if (response.data.length === 0) {
        toast.info('Kriterlere uygun hisse bulunamadı. Kriterleri gevşetmeyi deneyin.');
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

  // Kriter slider bileşeni
  const CriteriaSlider = ({ label, minKey, maxKey, minLimit, maxLimit, icon: Icon, color }) => (
    <div className="space-y-3 p-4 rounded-lg bg-[#F6F1EA]/50">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="font-medium text-[#2E2620]">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#7A6A5C]">Min</span>
            <span className="text-xs font-medium text-[#2E2620]">%{criteria[minKey]}</span>
          </div>
          <Slider
            value={criteria[minKey]}
            onValueChange={(v) => updateCriteria(minKey, v)}
            max={maxLimit}
            min={minLimit}
            step={5}
            className={`[&_[role=slider]]:${color === 'text-[#6D7C3B]' ? 'bg-[#6D7C3B]' : 'bg-[#B04832]'}`}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#7A6A5C]">Max</span>
            <span className="text-xs font-medium text-[#2E2620]">%{criteria[maxKey]}</span>
          </div>
          <Slider
            value={criteria[maxKey]}
            onValueChange={(v) => updateCriteria(maxKey, v)}
            max={maxLimit + 50}
            min={minLimit}
            step={5}
            className={`[&_[role=slider]]:${color === 'text-[#6D7C3B]' ? 'bg-[#6D7C3B]' : 'bg-[#B04832]'}`}
          />
        </div>
      </div>
    </div>
  );

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
              Her dip ve tepe noktası için kendi yükseliş/düşüş oranlarınızı belirleyin
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Criteria Form */}
            <div className="lg:col-span-1 space-y-6">
              {/* Date Range */}
              <Card className="card-organic" data-testid="date-range-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-['Playfair_Display'] text-[#2E2620] text-lg">
                    Tarih Aralığı
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[#7A6A5C] text-xs">Başlangıç</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal border-[#E6DCCF] hover:bg-[#E8D9C7]/50 text-sm"
                            data-testid="custom-start-date-btn"
                          >
                            <CalendarIcon className="mr-2 h-3 w-3 text-[#7A6A5C]" />
                            {startDate ? format(startDate, 'dd MMM yy', { locale: tr }) : 'Seç'}
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
                      <Label className="text-[#7A6A5C] text-xs">Bitiş</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal border-[#E6DCCF] hover:bg-[#E8D9C7]/50 text-sm"
                            data-testid="custom-end-date-btn"
                          >
                            <CalendarIcon className="mr-2 h-3 w-3 text-[#7A6A5C]" />
                            {endDate ? format(endDate, 'dd MMM yy', { locale: tr }) : 'Seç'}
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
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#7A6A5C]">Minimum Eşleşen Nokta</span>
                      <span className="text-sm font-medium text-[#2E2620]">{minPointsMatch}</span>
                    </div>
                    <Slider
                      value={minPointsMatch}
                      onValueChange={setMinPointsMatch}
                      max={10}
                      min={2}
                      step={1}
                      className="[&_[role=slider]]:bg-[#C86F4A]"
                    />
                    <p className="text-xs text-[#A89F91] mt-1">
                      En az {minPointsMatch} dip/tepe noktası eşleşmeli
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Criteria */}
              <Card className="card-organic" data-testid="pattern-criteria-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-['Playfair_Display'] text-[#2E2620] text-lg">
                    Dip & Tepe Kriterleri
                  </CardTitle>
                  <CardDescription className="text-[#7A6A5C] text-sm">
                    Her hareket için min/max % değerlerini ayarlayın
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <Accordion type="multiple" defaultValue={["item-1", "item-2"]} className="space-y-2">
                      {/* 1. Dip -> 1. Tepe */}
                      <AccordionItem value="item-1" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#B04832]/10 flex items-center justify-center text-xs font-medium text-[#B04832]">1</div>
                            <span className="text-sm">1. Dip → 1. Tepe</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Yükseliş Oranı"
                            minKey="rise_1_min"
                            maxKey="rise_1_max"
                            minLimit={50}
                            maxLimit={200}
                            icon={TrendingUp}
                            color="text-[#6D7C3B]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 1. Tepe -> 2. Dip */}
                      <AccordionItem value="item-2" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#6D7C3B]/10 flex items-center justify-center text-xs font-medium text-[#6D7C3B]">1</div>
                            <span className="text-sm">1. Tepe → 2. Dip</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Düşüş Oranı"
                            minKey="drop_1_min"
                            maxKey="drop_1_max"
                            minLimit={20}
                            maxLimit={80}
                            icon={TrendingDown}
                            color="text-[#B04832]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 2. Dip -> 2. Tepe */}
                      <AccordionItem value="item-3" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#B04832]/10 flex items-center justify-center text-xs font-medium text-[#B04832]">2</div>
                            <span className="text-sm">2. Dip → 2. Tepe</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Yükseliş Oranı"
                            minKey="rise_2_min"
                            maxKey="rise_2_max"
                            minLimit={10}
                            maxLimit={100}
                            icon={TrendingUp}
                            color="text-[#6D7C3B]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 2. Tepe -> 3. Dip */}
                      <AccordionItem value="item-4" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#6D7C3B]/10 flex items-center justify-center text-xs font-medium text-[#6D7C3B]">2</div>
                            <span className="text-sm">2. Tepe → 3. Dip</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Düşüş Oranı"
                            minKey="drop_2_min"
                            maxKey="drop_2_max"
                            minLimit={10}
                            maxLimit={50}
                            icon={TrendingDown}
                            color="text-[#B04832]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 3. Dip -> 3. Tepe */}
                      <AccordionItem value="item-5" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#B04832]/10 flex items-center justify-center text-xs font-medium text-[#B04832]">3</div>
                            <span className="text-sm">3. Dip → 3. Tepe</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Yükseliş Oranı"
                            minKey="rise_3_min"
                            maxKey="rise_3_max"
                            minLimit={10}
                            maxLimit={60}
                            icon={TrendingUp}
                            color="text-[#6D7C3B]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 3. Tepe -> 4. Dip */}
                      <AccordionItem value="item-6" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#6D7C3B]/10 flex items-center justify-center text-xs font-medium text-[#6D7C3B]">3</div>
                            <span className="text-sm">3. Tepe → 4. Dip</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Düşüş Oranı"
                            minKey="drop_3_min"
                            maxKey="drop_3_max"
                            minLimit={10}
                            maxLimit={50}
                            icon={TrendingDown}
                            color="text-[#B04832]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 4. Dip -> 4. Tepe */}
                      <AccordionItem value="item-7" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#B04832]/10 flex items-center justify-center text-xs font-medium text-[#B04832]">4</div>
                            <span className="text-sm">4. Dip → 4. Tepe</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Yükseliş Oranı"
                            minKey="rise_4_min"
                            maxKey="rise_4_max"
                            minLimit={5}
                            maxLimit={50}
                            icon={TrendingUp}
                            color="text-[#6D7C3B]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 4. Tepe -> 5. Dip */}
                      <AccordionItem value="item-8" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#6D7C3B]/10 flex items-center justify-center text-xs font-medium text-[#6D7C3B]">4</div>
                            <span className="text-sm">4. Tepe → 5. Dip</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Düşüş Oranı"
                            minKey="drop_4_min"
                            maxKey="drop_4_max"
                            minLimit={5}
                            maxLimit={40}
                            icon={TrendingDown}
                            color="text-[#B04832]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 5. Dip -> 5. Tepe */}
                      <AccordionItem value="item-9" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#B04832]/10 flex items-center justify-center text-xs font-medium text-[#B04832]">5</div>
                            <span className="text-sm">5. Dip → 5. Tepe</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Yükseliş Oranı"
                            minKey="rise_5_min"
                            maxKey="rise_5_max"
                            minLimit={5}
                            maxLimit={40}
                            icon={TrendingUp}
                            color="text-[#6D7C3B]"
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* 5. Tepe -> 6. Dip */}
                      <AccordionItem value="item-10" className="border-[#E6DCCF]">
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#6D7C3B]/10 flex items-center justify-center text-xs font-medium text-[#6D7C3B]">5</div>
                            <span className="text-sm">5. Tepe → 6. Dip</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CriteriaSlider
                            label="Düşüş Oranı"
                            minKey="drop_5_min"
                            maxKey="drop_5_max"
                            minLimit={5}
                            maxLimit={60}
                            icon={TrendingDown}
                            color="text-[#B04832]"
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </ScrollArea>

                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full py-6 mt-4"
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
                        Kalıp Ara
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
                      <p className="font-medium text-[#2E2620] mb-1">Nasıl Çalışır?</p>
                      <p>
                        Her dip ve tepe noktası arasındaki yükseliş/düşüş yüzdelerini belirleyin. 
                        Sistem, bu kriterlere uyan hisseleri BIST'te arar ve listeler.
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
                        Kriterleri ayarlayın ve "Kalıp Ara" butonuna tıklayın
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[700px]">
                      <div className="space-y-4">
                        {results.map((stock, index) => (
                          <div
                            key={stock.symbol}
                            className="p-4 rounded-xl border border-[#E6DCCF] hover:border-[#C86F4A]/30 hover:shadow-md transition-all"
                            data-testid={`result-${stock.symbol}`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-[#2E2620] font-['Playfair_Display']">
                                  {stock.symbol}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-sm text-[#7A6A5C]">
                                    Eşleşme: <span className="font-medium text-[#C86F4A]">%{stock.match_score}</span>
                                  </span>
                                  <span className="text-sm text-[#7A6A5C]">
                                    {stock.dip_count} Dip, {stock.peak_count} Tepe
                                  </span>
                                </div>
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
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {stock.peaks_troughs.map((pt, i) => (
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
                                      <span className="font-medium text-[#2E2620] text-xs">
                                        {pt.point_number}. {pt.point_type === 'tepe' ? 'Tepe' : 'Dip'}
                                      </span>
                                    </div>
                                    <p className="text-[#7A6A5C] text-xs">{pt.date}</p>
                                    <p className="text-[#2E2620] font-medium text-xs">
                                      ₺{pt.price?.toLocaleString('tr-TR')}
                                    </p>
                                    {pt.percentage_change && (
                                      <p className={`text-xs ${pt.percentage_change >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'}`}>
                                        {pt.percentage_change >= 0 ? '+' : ''}{pt.percentage_change}%
                                      </p>
                                    )}
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
