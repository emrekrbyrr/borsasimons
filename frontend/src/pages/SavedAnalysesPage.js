import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Bookmark,
  Clock,
  TrendingUp,
  ArrowRight,
  Loader2,
  Trash2
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SavedAnalysesPage = () => {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    fetchSavedAnalyses();
  }, []);

  const fetchSavedAnalyses = async () => {
    try {
      const response = await axios.get(`${API_URL}/analysis/saved`, {
        headers: getAuthHeader()
      });
      setAnalyses(response.data);
    } catch (error) {
      toast.error('Kayıtlı analizler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const openAnalysis = (analysis) => {
    navigate('/analysis', {
      state: {
        symbol: analysis.data.symbol,
        startDate: analysis.data.start_date,
        endDate: analysis.data.end_date
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F1EA]" data-testid="saved-analyses-page">
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E2620] font-['Playfair_Display']">
              Kayıtlı Analizler
            </h1>
            <p className="text-[#7A6A5C] mt-2">
              Daha önce kaydettiğiniz analizlere erişin
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#C86F4A]" />
            </div>
          ) : analyses.length === 0 ? (
            <Card className="card-organic" data-testid="empty-state-card">
              <CardContent className="py-16 text-center">
                <Bookmark className="w-16 h-16 text-[#E6DCCF] mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#2E2620] font-['Playfair_Display'] mb-2">
                  Henüz Kayıtlı Analiz Yok
                </h2>
                <p className="text-[#7A6A5C] mb-6 max-w-md mx-auto">
                  Analiz sayfasından yaptığınız analizleri kaydederek daha sonra tekrar erişebilirsiniz.
                </p>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full"
                  data-testid="go-to-dashboard-btn"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Yeni Analiz Başlat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis, index) => (
                <Card
                  key={analysis.id}
                  className="card-organic card-interactive animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => openAnalysis(analysis)}
                  data-testid={`saved-analysis-${analysis.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[#2E2620] font-['Playfair_Display']">
                          {analysis.data.symbol}
                        </h3>
                        <p className="text-sm text-[#7A6A5C]">
                          {analysis.data.start_date} - {analysis.data.end_date}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#C86F4A]/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#C86F4A]" />
                      </div>
                    </div>

                    {analysis.data.analysis?.summary && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#7A6A5C]">Toplam Getiri</span>
                          <span className={`font-medium ${
                            analysis.data.analysis.summary.total_return >= 0 
                              ? 'text-[#6D7C3B]' 
                              : 'text-[#B04832]'
                          }`}>
                            {analysis.data.analysis.summary.total_return >= 0 ? '+' : ''}
                            {analysis.data.analysis.summary.total_return?.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#7A6A5C]">Volatilite</span>
                          <span className="font-medium text-[#2E2620]">
                            {analysis.data.analysis.summary.volatility}%
                          </span>
                        </div>
                      </div>
                    )}

                    {analysis.data.similar_stocks?.length > 0 && (
                      <div className="mb-4 p-3 bg-[#F6F1EA] rounded-lg">
                        <p className="text-xs text-[#7A6A5C] mb-1">Benzer Hisseler</p>
                        <p className="text-sm font-medium text-[#2E2620]">
                          {analysis.data.similar_stocks.slice(0, 3).map(s => s.symbol).join(', ')}
                          {analysis.data.similar_stocks.length > 3 && ` +${analysis.data.similar_stocks.length - 3}`}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-[#E6DCCF]">
                      <div className="flex items-center text-sm text-[#7A6A5C]">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(new Date(analysis.created_at), 'dd MMM yyyy', { locale: tr })}
                      </div>
                      <div className="flex items-center text-[#C86F4A] text-sm font-medium">
                        <span>Görüntüle</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SavedAnalysesPage;
