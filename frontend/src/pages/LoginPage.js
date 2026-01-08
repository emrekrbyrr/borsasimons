import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { TrendingUp, Mail, Lock, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Giriş başarılı!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80"
          alt="Stock market analysis"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2E2620]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#C86F4A] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">
              BIST Analiz
            </h1>
          </div>
          <p className="text-white/80 text-lg max-w-md">
            BIST 100 hisselerinde benzer fiyat kalıplarını keşfedin. 
            Akıllı algoritmalarla yatırım fırsatlarını yakalayın.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#F6F1EA] p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-full bg-[#C86F4A] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#2E2620] font-['Playfair_Display']">
              BIST Analiz
            </h1>
          </div>

          <Card className="border-[#E6DCCF] shadow-[0_4px_24px_rgba(46,38,32,0.08)]">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-['Playfair_Display'] text-[#2E2620]">
                Hoş Geldiniz
              </CardTitle>
              <CardDescription className="text-[#7A6A5C]">
                Hesabınıza giriş yapın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#2E2620]">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89F91]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-[#E6DCCF] focus:border-[#C86F4A] focus:ring-[#C86F4A]/20"
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#2E2620]">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89F91]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-[#E6DCCF] focus:border-[#C86F4A] focus:ring-[#C86F4A]/20"
                      required
                      data-testid="login-password-input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C86F4A] hover:bg-[#B05D3A] text-white rounded-full py-6 font-medium transition-all"
                  data-testid="login-submit-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Giriş yapılıyor...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Giriş Yap
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[#7A6A5C]">
                  Hesabınız yok mu?{' '}
                  <Link
                    to="/register"
                    className="text-[#C86F4A] hover:text-[#B05D3A] font-medium transition-colors"
                    data-testid="register-link"
                  >
                    Kayıt Olun
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
