import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API_URL = `${BACKEND_URL}/api`;

const PendingApprovalsPage = () => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [users, setUsers] = useState([]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/pending-users`, { headers: getAuthHeader() });
      setUsers(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Onay bekleyen kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approveUser = async (userId) => {
    setApprovingId(userId);
    try {
      await axios.post(`${API_URL}/admin/pending-users/${userId}/approve`, {}, { headers: getAuthHeader() });
      toast.success('Kullanıcı onaylandı');
      await fetchPending();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Onay işlemi başarısız');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1EA]" data-testid="pending-approvals-page">
      <Sidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#2E2620] font-['Playfair_Display']">
              Onay Bekleyenler
            </h1>
            <p className="text-[#7A6A5C] mt-2">
              Yeni kayıt olan kullanıcıları buradan onaylayabilirsiniz.
            </p>
          </div>

          <Card className="border-[#E6DCCF]">
            <CardHeader>
              <CardTitle className="text-[#2E2620]">Bekleyen kullanıcılar</CardTitle>
              <CardDescription className="text-[#7A6A5C]">
                {loading ? 'Yükleniyor...' : `${users.length} kişi`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-[#7A6A5C]">Yükleniyor...</div>
              ) : users.length === 0 ? (
                <div className="text-[#7A6A5C]">Bekleyen kullanıcı yok.</div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-4 bg-white border border-[#E6DCCF] rounded-lg p-4"
                    >
                      <div className="min-w-0">
                        <div className="text-[#2E2620] font-medium truncate">{u.full_name}</div>
                        <div className="text-sm text-[#7A6A5C] truncate">{u.email}</div>
                        <div className="text-xs text-[#A89F91] mt-1">Kayıt: {u.created_at}</div>
                      </div>
                      <Button
                        onClick={() => approveUser(u.id)}
                        disabled={approvingId === u.id}
                        className="bg-[#6D7C3B] hover:bg-[#5F6E34] text-white rounded-full"
                      >
                        {approvingId === u.id ? 'Onaylanıyor...' : 'Onayla'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PendingApprovalsPage;
