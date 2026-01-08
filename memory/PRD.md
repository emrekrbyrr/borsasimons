# BIST Analiz - Product Requirements Document

## Orijinal Problem Statement
BIST 100 hisselerinde benzer fiyat kalıplarını analiz eden web platformu. Kullanıcı bir hissenin seçilen tarih aralığındaki fiyat dalgalanmasına benzer hareket eden hisseleri bulmak istiyor. Sistem topoloji ve benzerlik araştırması yapacak. Özel kriterler girerek (dip/tepe noktaları) bu kriterlere uyan hisseleri listeleycek.

## User Personas
1. **Yatırımcı Ahmet**: Teknik analiz yapan bireysel yatırımcı, geçmiş kalıplardan geleceği tahmin etmek istiyor
2. **Finans Analisti Ayşe**: Profesyonel analist, benzer fiyat hareketlerini karşılaştırmak istiyor

## Core Requirements (Static)
- [x] Kullanıcı kayıt/giriş sistemi (JWT)
- [x] BIST 100 hisse listesi
- [x] Yahoo Finance API ile veri çekme
- [x] Tarih aralığı seçimi
- [x] Hisse analizi ve grafik görselleştirme
- [x] Dip/Tepe noktası tespiti algoritması
- [x] Benzerlik analizi (DTW + Pearson Correlation)
- [x] Özel kalıp arama
- [x] Analiz kaydetme

## What's Been Implemented (08 Ocak 2026)
### Backend
- FastAPI + MongoDB
- JWT authentication
- Yahoo Finance entegrasyonu
- Benzerlik algoritması (Euclidean distance + Pearson correlation)
- Dip/Tepe tespiti algoritması
- Custom pattern search
- Analysis save/load

### Frontend
- React + Tailwind CSS
- Pinterest kahve-krem tema (Organic & Earthy)
- Playfair Display + Manrope fontları
- Login/Register sayfaları
- Dashboard (hisse seçimi, tarih aralığı)
- Analysis sayfası (grafik, dip/tepe noktaları, benzer hisseler)
- Custom Pattern sayfası
- Saved Analyses sayfası
- Recharts ile grafik görselleştirme

## Prioritized Backlog
### P0 (Done)
- ✅ Authentication
- ✅ Stock analysis
- ✅ Similarity search
- ✅ Chart visualization

### P1 (Next)
- [ ] Daha detaylı kalıp eşleştirme (6 dip, 5 tepe noktası kriterleri)
- [ ] Anlık fiyat güncellemeleri (WebSocket)
- [ ] Hisse karşılaştırma görünümü (2 hisseyi yan yana)

### P2 (Future)
- [ ] PDF/CSV export
- [ ] Email bildirimleri
- [ ] Favori hisseler listesi
- [ ] Performans optimizasyonu (caching)

## Tech Stack
- Backend: FastAPI, MongoDB, yfinance, scipy, scikit-learn
- Frontend: React, Tailwind CSS, Recharts, Shadcn/UI
- Auth: JWT

## Next Action Items
1. Kullanıcının istediği detaylı 6 dip / 5 tepe noktası kriterlerini implement et
2. Benzerlik sonuçlarını dışa aktarma (CSV)
3. Hisse karşılaştırma görünümü
