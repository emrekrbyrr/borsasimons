# BIST Analiz - Product Requirements Document

## Orijinal Problem Statement
BIST 100 hisselerinde benzer fiyat kalıplarını analiz eden web platformu. Kullanıcı bir hissenin seçilen tarih aralığındaki fiyat dalgalanmasına benzer hareket eden hisseleri bulmak istiyor.

## User Personas
1. **Yatırımcı Ahmet**: Teknik analiz yapan bireysel yatırımcı
2. **Finans Analisti Ayşe**: Profesyonel analist

## Core Requirements (Static)
- [x] Kullanıcı kayıt/giriş sistemi (JWT)
- [x] BIST hisse listesi (444+ hisse - TGSAS, DESPC dahil)
- [x] Yahoo Finance API ile veri çekme
- [x] Tarih aralığı seçimi
- [x] Hisse analizi ve grafik görselleştirme
- [x] Dip/Tepe noktası tespiti
- [x] Benzerlik analizi (Tam Kalıp)
- [x] **Devam Eden Kalıp Araması (YENİ)** - Kalıbın başlangıcına benzeyen ama tamamlanmamış hisseler
- [x] Özel kalıp arama
- [x] Analiz kaydetme

## What's Been Implemented (08 Ocak 2026)
### İterasyon 1 - MVP
- Temel auth sistemi
- BIST 100 hisse analizi
- Grafik görselleştirme
- Benzerlik araması

### İterasyon 2 - Güncellemeler (08 Ocak 2026)
- **Hisse listesi genişletildi**: 100 → 444 hisse (TGSAS, DESPC ve diğerleri eklendi)
- **Devam Eden Kalıp özelliği**: `/api/stocks/find-partial-match` endpoint'i
- Frontend'e "Tam Kalıp" / "Devam Eden Kalıp" sekmeleri eklendi
- Kalıp başlangıç oranı ayarlanabilir (20-60%)

## Tech Stack
- Backend: FastAPI, MongoDB, yfinance, scipy, scikit-learn
- Frontend: React, Tailwind CSS, Recharts, Shadcn/UI
- Auth: JWT

## Next Action Items
1. Detaylı 6 dip / 5 tepe noktası kriterlerini optimize et
2. CSV/PDF dışa aktarma
3. Performans optimizasyonu (caching)
