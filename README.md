# Koç GPA — Not Ortalaması Hesaplama & Projeksiyon

Koç Üniversitesi öğrencileri için GPA (CGPA) hesaplama ve **"what-if" projeksiyon** aracı.
"Bu dönem şu dersten A, şu dersten B alırsam ortalamam kaça çıkar?" sorusunu anında yanıtlar.

> **Not:** Gayriresmî bir araçtır. Sonuçlar tahminidir; resmî ortalama için transkript ve
> Öğrenci İşleri esas alınmalıdır.

## Özellikler

- **📈 Projeksiyon** — Mevcut GPA + toplam krediye planlanan dersleri ekleyip yeni CGPA'yı görme.
  Ders **tekrarı (retake)** desteği: Koç kuralına göre *en yüksek not* sayılır.
- **🧮 Sıfırdan Hesapla** — Tüm dersleri girip ortalamayı baştan hesaplama.
- **🎯 Hedef GPA** — İstenen ortalamaya ulaşmak için gereken dönem ortalamasını (ve minimum harf notunu) bulma.
- Basit (GPA + kredi) **veya** Detaylı (dersleri tek tek) giriş modu.
- TR / EN dil desteği, açık/koyu tema, `localStorage` ile veri kalıcılığı.

## Teknik yığın

Vite + React 19 + TypeScript + Tailwind CSS v4. Test: Vitest.

```bash
npm install
npm run dev       # geliştirme sunucusu (http://localhost:5173)
npm run build     # tsc + production build
npm run test      # hesaplama motoru birim testleri
npm run lint
```

## Mimari

```
src/
  lib/
    grades.ts      # Koç harf notu skalası (katsayılar, GPA'ya giren/girmeyen notlar)
    gpa.ts         # Saf hesaplama motoru: calcGpaFromCourses / projectGpa / requiredTermGpa
    gpa.test.ts    # Hesaplama motorunun birim testleri (kritik — önce burayı çalıştır)
    i18n.tsx       # TR/EN sözlük + provider
    hooks.ts       # useLocalStorage, useTheme, uid
  components/
    tabs/          # ProjectionTab, ScratchTab, TargetTab
    ui.tsx, CourseList, CurrentStanding, GradeSelect, GpaVisual, ResultParts, Header, InfoPanel
```

Hesaplama mantığı UI'dan tamamen ayrıdır (`src/lib/`), böylece test edilebilir ve
ileride başka üniversiteler / bir API için yeniden kullanılabilir.

## Koç Üniversitesi hesaplama kuralları

| Not | Katsayı | Not | Katsayı |
|-----|---------|-----|---------|
| A+ / A | 4.0 | C | 2.0 |
| A- | 3.7 | C- | 1.7 |
| B+ | 3.3 | D+ | 1.3 |
| B | 3.0 | D | 1.0 |
| B- | 2.7 | F | 0.0 |
| C+ | 2.3 | | |

- **GPA'ya girmeyen notlar:** `S`, `U`, `P`, `W` (idari notlar). `F` → 0.00 olarak ortalamaya girer.
- **Ağırlık:** Koç kredisi ile (ECTS değil).
- `GPA = Σ(katsayı × kredi) / Σ(kredi)` — yalnızca harf notlu (A+…F) dersler.
- **Ders tekrarı:** Aynı ders tekrar alınırsa **en yüksek harf notu** ortalamaya sayılır,
  krediler bir kez sayılır.
- Eşikler: Mezuniyet ≥ 2.00 · Vehbi Koç Onur Öğrencisi ≥ 3.50.

### Kaynaklar

- Koç Üniversitesi resmî harf notu skalası (Academic Council 2020/07)
- Koç Üniversitesi Registrar — not sistemi ve ders tekrar kuralları

## Yayına alma (Deploy)

Statik bir SPA — herhangi bir statik host'a `dist/` atmak yeterli. Konfig hazır
(`netlify.toml`, `vercel.json`, `public/site.webmanifest`, OG görselleri).

**Vercel:**
```bash
npm i -g vercel      # bir kez
vercel               # önizleme, sonra `vercel --prod`
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --build            # önizleme
netlify deploy --build --prod     # yayın
```

**Cloudflare Pages / diğer:** build komutu `npm run build`, çıktı klasörü `dist`.

**Deploy sonrası yapılacaklar:**
- `index.html` içindeki `skymoongpa.com`'u gerçek alan adınla değiştir (canonical + OG/Twitter).
- Analytics'i aktifleştir: `index.html` sonundaki yorumlu Plausible satırını aç, `data-domain`'i güncelle.
- OG önizlemesini test et: [opengraph.xyz](https://www.opengraph.xyz) ya da paylaşım hata ayıklayıcıları.

## Yol haritası (sonraki adımlar)

- Diğer üniversitelerin not sistemleri (skalayı `grades.ts`'te soyutlayıp seçilebilir yapmak).
- Dönemleri kaydetme / birden fazla dönemi yönetme.
- Transkript CSV/ekran görüntüsünden içe aktarma.
