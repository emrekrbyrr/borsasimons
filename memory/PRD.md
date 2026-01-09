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
- [x] **Devam Eden Kalıp Araması** - Kalıbın başlangıcına benzeyen ama tamamlanmamış hisseler
- [x] Özel kalıp arama
- [x] Analiz kaydetme

## What's Been Implemented

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

### İterasyon 3 - Mum Grafik ve Marker'lar (08 Ocak 2026)
- **Analiz Sayfası Mum Grafiği**: AnalysisPage'de profesyonel candlestick chart
- **Dip/Tepe Marker'ları**: Analiz sonuçlarında tespit edilen noktalar grafikte gösteriliyor
- **lightweight-charts v5 Uyumu**: `createSeriesMarkers()` API'si ile marker desteği
- **Dashboard Tarih Seçimi Vurgulaması**: Seçilen başlangıç ve bitiş tarihleri grafikte marker olarak gösteriliyor
- Başlangıç marker'ı (yeşil ok yukarı) ve Bitiş marker'ı (kırmızı ok aşağı)

### İterasyon 4 - Sliding Window Algoritması (08 Ocak 2026)
- **Tarihsel Kalıp Araması**: Benzer kalıp araması artık her hissenin son 7 yıllık TÜM geçmişinde yapılıyor
- **Sliding Window**: Her hissenin geçmişinde referans kalıpla aynı uzunlukta pencereler oluşturup en benzeri bulunuyor
- **Farklı Tarihler**: Benzer hisseler artık FARKLI tarihlerde bulunuyor (2022, 2023, 2024 vb.)
- **Kalıptan Sonra Ne Oldu**: Her benzer hisse için:
  - 1 Ay sonraki fiyat değişimi (%)
  - 3 Ay sonraki fiyat değişimi (%)
  - Kalıp sonu fiyatı
- Kullanıcı artık benzer kalıp yapan hisselerin "geleceğini" tahmin edebilir

### İterasyon 5 - Grafik Üzerinde Kalıp Çizimi (09 Ocak 2026)
- **Yeni Sayfa: /draw-pattern** - Grafik üzerinde çizim yaparak kalıp belirleme
- **Çizim Modu:** Kullanıcı grafikte tıklayarak dip/tepe noktaları işaretleyebiliyor
- **Otomatik Oran Hesaplama:** Noktalar arasındaki yüzde değişimler otomatik hesaplanıyor
- **Turuncu Çizgi:** Seçilen noktalar arasında görsel bağlantı
- **Geri Al / Temizle:** Son noktayı silme veya tüm noktaları temizleme
- **Benzer Kalıp Arama:** Çizilen kalıba benzer hisseleri bulma

### İterasyon 5.1 - Karşılaştırma Modal Kaydırılabilir Grafik
- **Kaydırılabilir Grafik:** Benzer hisse grafiği artık kalıptan sonrasını görmek için kaydırılabilir
- **İlk Görünüm:** Grafik açıldığında kalıp tarihleri görünüyor
- **Kaydırma İpucu:** "← Grafiği kaydırarak kalıptan sonrasını görebilirsiniz →"
- **Referans Göstergesi:** Referans hisse grafiğinde "Seçili Aralık" bilgisi

## Tech Stack
- Backend: FastAPI, MongoDB, yfinance, scipy, scikit-learn
- Frontend: React, Tailwind CSS, lightweight-charts v5.1.0, Shadcn/UI
- Auth: JWT

## Prioritized Backlog

### P0 (Tamamlandı)
- [x] Analiz sayfası mum grafiği
- [x] Dip/tepe marker'ları
- [x] Dashboard tarih seçimi vurgulaması
- [x] **İki Hisse Karşılaştırma Modal'ı** - Benzer hisse bulunduktan sonra yan yana grafik karşılaştırması

### P1 (Sıradaki)
- [ ] Özel kalıpları kullanıcı profiline kaydetme
- [ ] CSV/PDF dışa aktarma

### P2 (Gelecek)
- [ ] Hacim verisi ekleme (volume series)
- [ ] Teknik indikatörler (MA, RSI)
- [ ] Performans optimizasyonu (caching)

### P3 (İleriki)
- [ ] Görsel kalıp çizimi

## Test Raporları
- `/app/test_reports/iteration_4.json` - Backend %100, Frontend %100 test başarısı
- `/app/test_reports/iteration_5.json` - Karşılaştırma özelliği %100 test başarısı
- `/app/test_reports/iteration_6.json` - Sliding Window algoritması %100 test başarısı
