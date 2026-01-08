import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AnalysisCandlestickChart from '../components/AnalysisCandlestickChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AnalysisPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [searchingSimular, setSearchingSimular] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [similarStocks, setSimilarStocks] = useState([]);
  const [selectedSimilar, setSelectedSimilar] = useState(null);
  const [minSimilarity, setMinSimilarity] = useState([70]);
  const [searchMode, setSearchMode] = useState('full'); // 'full' or 'partial'
  const [patternPercent, setPatternPercent] = useState([30]);
  
  const { symbol, startDate, endDate } = location.state || {};

  useEffect(() => {
    if (symbol && startDate && endDate) {
      fetchAnalysis();
    }
  }, [symbol, startDate, endDate]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/stocks/analyze`,
        { symbol, start_date: startDate, end_date: endDate },
        { headers: getAuthHeader() }
      );
      setAnalysis(response.data);
    } catch (error) {
      toast.error('Analiz yapılırken hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const findSimilarStocks = async () => {
    setSearchingSimular(true);
    try {
      let response;
      
      if (searchMode === 'partial') {
        // Devam eden kalıp araması
        response = await axios.post(
          `${API_URL}/stocks/find-partial-match`,
          {
            symbol,
            start_date: startDate,
            end_date: endDate,
            min_similarity: minSimilarity[0] / 100,
            pattern_start_percent: patternPercent[0],
            limit: 20
          },
          { headers: getAuthHeader() }
        );
      } else {
        // Tam kalıp araması
        response = await axios.post(
          `${API_URL}/stocks/find-similar`,
          {
            symbol,
            start_date: startDate,
            end_date: endDate,
            min_similarity: minSimilarity[0] / 100,
            limit: 20
          },
          { headers: getAuthHeader() }
        );
      }
      
      setSimilarStocks(response.data);
      if (response.data.length === 0) {
        toast.info('Benzer hisse bulunamadı. Eşik değerini düşürmeyi deneyin.');
      } else {
        const modeText = searchMode === 'partial' ? 'devam eden kalıp' : 'benzer kalıp';
        toast.success(`${response.data.length} ${modeText} bulundu`);
      }
    } catch (error) {
      toast.error('Benzer hisse aranırken hata oluştu');
    } finally {
      setSearchingSimular(false);
    }
  };

  const saveAnalysis = async () => {
    try {
      await axios.post(
        `${API_URL}/analysis/save`,
        {
          symbol,
          start_date: startDate,
          end_date: endDate,
          analysis: analysis,
          similar_stocks: similarStocks
        },
        { headers: getAuthHeader() }
      );
      toast.success('Analiz kaydedildi');
    } catch (error) {
      toast.error('Kaydetme başarısız');
    }
  };

  const getSimilarityBadgeClass = (score) => {
    if (score >= 85) return 'badge-similarity badge-high';
    if (score >= 70) return 'badge-similarity badge-medium';
    return 'badge-similarity badge-low';
  };

  // Prepare chart data with peak/trough markers
  const chartData = analysis?.prices?.map((p) => ({
    date: p.date,
    price: p.close
  })) || [];

  const peakData = analysis?.peaks_troughs?.filter(pt => pt.point_type === 'tepe').map(pt => ({
    date: pt.date,
    price: pt.price,
    type: 'tepe',
    number: pt.point_number
  })) || [];

  const troughData = analysis?.peaks_troughs?.filter(pt => pt.point_type === 'dip').map(pt => ({
    date: pt.date,
    price: pt.price,
    type: 'dip',
    number: pt.point_number
  })) || [];

  if (!symbol) {
    return (
      <div className="min-h-screen bg-[#F6F1EA] flex items-center justify-center">
        <Card className="card-organic p-8 text-center">
          <p className="text-[#7A6A5C] mb-4">Analiz parametreleri eksik</p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full"
          >
            Dashboard'a Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F1EA]" data-testid="analysis-page">
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full"
                data-testid="back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-[#2E2620] font-['Playfair_Display']">
                  {symbol} Analizi
                </h1>
                <p className="text-[#7A6A5C]">
                  {startDate} - {endDate}
                </p>
              </div>
            </div>
            <Button
              onClick={saveAnalysis}
              className="bg-[#6D7C3B] hover:bg-[#5C6B2F] text-white rounded-full"
              data-testid="save-analysis-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#C86F4A]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Price Chart */}
                <Card className="card-organic" data-testid="price-chart-card">
                  <CardHeader>
                    <CardTitle className="font-['Playfair_Display'] text-[#2E2620]">
                      Fiyat Grafiği
                    </CardTitle>
                    <CardDescription className="text-[#7A6A5C]">
                      Dip ve tepe noktaları işaretli
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E6DCCF" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: '#7A6A5C', fontSize: 12 }}
                            tickFormatter={(value) => value.slice(5)}
                          />
                          <YAxis 
                            tick={{ fill: '#7A6A5C', fontSize: 12 }}
                            tickFormatter={(value) => `₺${value}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#C86F4A"
                            strokeWidth={2}
                            dot={false}
                            name="Kapanış Fiyatı"
                          />
                          {/* Peak markers */}
                          {peakData.map((peak, i) => (
                            <ReferenceDot
                              key={`peak-${i}`}
                              x={peak.date}
                              y={peak.price}
                              r={6}
                              fill="#6D7C3B"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                          {/* Trough markers */}
                          {troughData.map((trough, i) => (
                            <ReferenceDot
                              key={`trough-${i}`}
                              x={trough.date}
                              y={trough.price}
                              r={6}
                              fill="#B04832"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#6D7C3B]" />
                        <span className="text-sm text-[#7A6A5C]">Tepe Noktası</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#B04832]" />
                        <span className="text-sm text-[#7A6A5C]">Dip Noktası</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Similar Stocks Search */}
                <Card className="card-organic" data-testid="similar-search-card">
                  <CardHeader>
                    <CardTitle className="font-['Playfair_Display'] text-[#2E2620]">
                      Benzer Hisse Ara
                    </CardTitle>
                    <CardDescription className="text-[#7A6A5C]">
                      Bu kalıba benzer veya devam eden kalıpları bulun
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Search Mode Tabs */}
                      <Tabs value={searchMode} onValueChange={setSearchMode} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-[#E8D9C7]">
                          <TabsTrigger value="full" data-testid="full-match-tab">
                            Tam Kalıp
                          </TabsTrigger>
                          <TabsTrigger value="partial" data-testid="partial-match-tab">
                            Devam Eden Kalıp
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="full" className="mt-4 space-y-4">
                          <div className="p-3 bg-[#F6F1EA] rounded-lg">
                            <p className="text-sm text-[#7A6A5C]">
                              Seçilen tarih aralığındaki kalıbın tamamına benzer hisseleri bulur.
                            </p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="partial" className="mt-4 space-y-4">
                          <div className="p-3 bg-[#C86F4A]/10 rounded-lg border border-[#C86F4A]/20">
                            <p className="text-sm text-[#7A6A5C]">
                              <strong className="text-[#C86F4A]">Yeni!</strong> Kalıbın başlangıcına benzeyen ama henüz tamamlanmamış hisseleri bulur. 
                              Bu hisseler kalıbın devamını yapabilir.
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-[#7A6A5C]">Kalıp Başlangıç Oranı</span>
                              <span className="text-sm font-medium text-[#2E2620]">{patternPercent}%</span>
                            </div>
                            <Slider
                              value={patternPercent}
                              onValueChange={setPatternPercent}
                              max={60}
                              min={20}
                              step={5}
                              className="[&_[role=slider]]:bg-[#C86F4A]"
                              data-testid="pattern-percent-slider"
                            />
                            <p className="text-xs text-[#A89F91] mt-1">
                              Referans kalıbın ilk %{patternPercent}'ını karşılaştırır
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#7A6A5C]">Minimum Benzerlik</span>
                          <span className="text-sm font-medium text-[#2E2620]">{minSimilarity}%</span>
                        </div>
                        <Slider
                          value={minSimilarity}
                          onValueChange={setMinSimilarity}
                          max={100}
                          min={50}
                          step={5}
                          className="[&_[role=slider]]:bg-[#C86F4A]"
                          data-testid="similarity-slider"
                        />
                      </div>
                      <Button
                        onClick={findSimilarStocks}
                        disabled={searchingSimular}
                        className="w-full bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full"
                        data-testid="find-similar-btn"
                      >
                        {searchingSimular ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Aranıyor...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {searchMode === 'partial' ? 'Devam Eden Kalıpları Bul' : 'Benzer Hisseleri Bul'}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Similar Stocks List */}
                    {similarStocks.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-[#2E2620] mb-3">
                          {searchMode === 'partial' ? 'Devam Eden Kalıplar' : 'Benzer Hisseler'} ({similarStocks.length})
                        </h4>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {similarStocks.map((stock, index) => (
                              <div
                                key={stock.symbol}
                                onClick={() => setSelectedSimilar(stock)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                  selectedSimilar?.symbol === stock.symbol
                                    ? 'border-[#C86F4A] bg-[#C86F4A]/5'
                                    : 'border-[#E6DCCF] hover:border-[#C86F4A]/50'
                                }`}
                                data-testid={`similar-stock-${stock.symbol}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-[#2E2620]">
                                        {stock.symbol}
                                      </span>
                                      <span className={getSimilarityBadgeClass(stock.similarity_score)}>
                                        {stock.similarity_score}%
                                      </span>
                                      {stock.match_type === 'partial' && (
                                        <Badge variant="outline" className="text-xs bg-[#C86F4A]/10 text-[#C86F4A] border-[#C86F4A]/30">
                                          Devam Ediyor
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-[#7A6A5C] mt-1">
                                      Korelasyon: {stock.correlation}%
                                      {stock.pattern_progress && (
                                        <span className="ml-2">• İlerleme: %{stock.pattern_progress}</span>
                                      )}
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
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Stats & Peaks */}
              <div className="space-y-6">
                {/* Summary Stats */}
                <Card className="card-organic" data-testid="summary-stats-card">
                  <CardHeader>
                    <CardTitle className="font-['Playfair_Display'] text-[#2E2620]">
                      Özet İstatistikler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-[#E6DCCF]">
                      <span className="text-[#7A6A5C]">En Düşük</span>
                      <span className="font-medium text-[#2E2620]">
                        ₺{analysis?.summary?.min_price?.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#E6DCCF]">
                      <span className="text-[#7A6A5C]">En Yüksek</span>
                      <span className="font-medium text-[#2E2620]">
                        ₺{analysis?.summary?.max_price?.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#E6DCCF]">
                      <span className="text-[#7A6A5C]">Ortalama</span>
                      <span className="font-medium text-[#2E2620]">
                        ₺{analysis?.summary?.avg_price?.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#E6DCCF]">
                      <span className="text-[#7A6A5C]">Volatilite</span>
                      <span className="font-medium text-[#2E2620]">
                        {analysis?.summary?.volatility}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[#7A6A5C]">Toplam Getiri</span>
                      <span className={`font-medium ${
                        (analysis?.summary?.total_return || 0) >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'
                      }`}>
                        {analysis?.summary?.total_return >= 0 ? '+' : ''}
                        {analysis?.summary?.total_return}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Peak/Trough Points */}
                <Card className="card-organic" data-testid="peaks-troughs-card">
                  <CardHeader>
                    <CardTitle className="font-['Playfair_Display'] text-[#2E2620]">
                      Dip & Tepe Noktaları
                    </CardTitle>
                    <CardDescription className="text-[#7A6A5C]">
                      Tespit edilen kritik noktalar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-[#E8D9C7]">
                        <TabsTrigger value="all">Tümü</TabsTrigger>
                        <TabsTrigger value="peaks">Tepeler</TabsTrigger>
                        <TabsTrigger value="troughs">Dipler</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="mt-4">
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-3">
                            {analysis?.peaks_troughs?.map((point, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-[#F6F1EA] border border-[#E6DCCF]"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {point.point_type === 'tepe' ? (
                                    <TrendingUp className="w-4 h-4 text-[#6D7C3B]" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-[#B04832]" />
                                  )}
                                  <span className="font-medium text-[#2E2620]">
                                    {point.point_number}. {point.point_type === 'tepe' ? 'Tepe' : 'Dip'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-[#7A6A5C]">Tarih:</span>
                                    <p className="text-[#2E2620]">{point.date}</p>
                                  </div>
                                  <div>
                                    <span className="text-[#7A6A5C]">Fiyat:</span>
                                    <p className="text-[#2E2620]">₺{point.price?.toLocaleString('tr-TR')}</p>
                                  </div>
                                  {point.percentage_change && (
                                    <div className="col-span-2">
                                      <span className="text-[#7A6A5C]">Değişim:</span>
                                      <p className={point.percentage_change >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'}>
                                        {point.percentage_change >= 0 ? '+' : ''}{point.percentage_change}%
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {(!analysis?.peaks_troughs || analysis.peaks_troughs.length === 0) && (
                              <div className="text-center py-8 text-[#7A6A5C]">
                                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Kriterlere uygun nokta bulunamadı</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="peaks" className="mt-4">
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-3">
                            {analysis?.peaks_troughs?.filter(p => p.point_type === 'tepe').map((point, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-[#6D7C3B]/5 border border-[#6D7C3B]/20"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="w-4 h-4 text-[#6D7C3B]" />
                                  <span className="font-medium text-[#2E2620]">
                                    {point.point_number}. Tepe
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-[#7A6A5C]">Tarih:</span>
                                    <p className="text-[#2E2620]">{point.date}</p>
                                  </div>
                                  <div>
                                    <span className="text-[#7A6A5C]">Fiyat:</span>
                                    <p className="text-[#2E2620]">₺{point.price?.toLocaleString('tr-TR')}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="troughs" className="mt-4">
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-3">
                            {analysis?.peaks_troughs?.filter(p => p.point_type === 'dip').map((point, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-[#B04832]/5 border border-[#B04832]/20"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingDown className="w-4 h-4 text-[#B04832]" />
                                  <span className="font-medium text-[#2E2620]">
                                    {point.point_number}. Dip
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-[#7A6A5C]">Tarih:</span>
                                    <p className="text-[#2E2620]">{point.date}</p>
                                  </div>
                                  <div>
                                    <span className="text-[#7A6A5C]">Fiyat:</span>
                                    <p className="text-[#2E2620]">₺{point.price?.toLocaleString('tr-TR')}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Selected Similar Stock Details */}
                {selectedSimilar && (
                  <Card className="card-organic animate-slide-up" data-testid="selected-similar-card">
                    <CardHeader>
                      <CardTitle className="font-['Playfair_Display'] text-[#2E2620]">
                        {selectedSimilar.symbol} Detayları
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-[#E6DCCF]">
                        <span className="text-[#7A6A5C]">Benzerlik</span>
                        <span className={getSimilarityBadgeClass(selectedSimilar.similarity_score)}>
                          {selectedSimilar.similarity_score}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#E6DCCF]">
                        <span className="text-[#7A6A5C]">Korelasyon</span>
                        <span className="font-medium text-[#2E2620]">{selectedSimilar.correlation}%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#E6DCCF]">
                        <span className="text-[#7A6A5C]">Güncel Fiyat</span>
                        <span className="font-medium text-[#2E2620]">
                          ₺{selectedSimilar.current_price?.toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[#7A6A5C]">Dönem Getirisi</span>
                        <span className={`font-medium ${
                          selectedSimilar.price_change_percent >= 0 ? 'text-[#6D7C3B]' : 'text-[#B04832]'
                        }`}>
                          {selectedSimilar.price_change_percent >= 0 ? '+' : ''}
                          {selectedSimilar.price_change_percent?.toFixed(2)}%
                        </span>
                      </div>
                      
                      {selectedSimilar.peaks_troughs?.length > 0 && (
                        <div className="pt-4 border-t border-[#E6DCCF]">
                          <h4 className="text-sm font-medium text-[#2E2620] mb-3">Dip/Tepe Noktaları</h4>
                          <div className="space-y-2">
                            {selectedSimilar.peaks_troughs.slice(0, 4).map((pt, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  {pt.point_type === 'tepe' ? (
                                    <TrendingUp className="w-3 h-3 text-[#6D7C3B]" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 text-[#B04832]" />
                                  )}
                                  {pt.point_number}. {pt.point_type === 'tepe' ? 'Tepe' : 'Dip'}
                                </span>
                                <span className="text-[#7A6A5C]">{pt.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          navigate('/analysis', {
                            state: {
                              symbol: selectedSimilar.symbol,
                              startDate,
                              endDate
                            }
                          });
                          window.location.reload();
                        }}
                        className="w-full bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full mt-4"
                        data-testid="analyze-similar-btn"
                      >
                        Bu Hisseyi Analiz Et
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
