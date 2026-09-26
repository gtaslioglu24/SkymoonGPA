# Skymoon GPA — Not Ortalaması Hesaplama & Projeksiyon

![Skymoon GPA](public/og.png)

Koç Üniversitesi öğrencileri için GPA (CGPA) hesaplama ve **"what-if" projeksiyon** aracı.
"Bu dönem şu dersten A, şu dersten B alırsam ortalamam kaça çıkar?" sorusunu anında yanıtlar.

> **Not:** Gayriresmî bir araçtır, Koç Üniversitesi ile bağlantısı yoktur. Sonuçlar tahminidir;
> resmî ortalama için transkript ve Öğrenci İşleri esas alınmalıdır.

**Girdiğin hiçbir veri sunucuya gitmez.** Backend yok; her şey tarayıcında hesaplanır ve
`localStorage`'da kalır. Uygulama içindeki "Verilerimi sil" düğmesi kayıtlı her şeyi temizler.

## Özellikler

- **📋 Transkript yapıştır** — KUSIS tablosunu ya da PDF transkripti kopyalayıp yapıştır; dersler,
  krediler, notlar ve dönemler otomatik okunur. İçe aktarmadan önce **önizleme** gösterilir:
  okunamayan satırlar listelenir, yanlış okunan satırlar tek tıkla çıkarılır.
- **📈 Simülasyon** — Mevcut GPA + toplam krediye planlanan dersleri ekleyip yeni CGPA'yı görme.
  Ders **tekrarı (retake)** desteği: kural seçilebilir (en yüksek / son / hepsi sayılsın).
- **🧮 Sıfırdan Hesapla** — Tüm dersleri girip ortalamayı baştan hesaplama; çift anadal (ÇAP)
  için ayrı ortalamalar.
- **📊 Dönemler** — Dönem dönem giriş, dönem ortalaması (SPA) ve kümülatif GPA grafiği.
- **🎯 Hedef GPA** — İstenen ortalamaya ulaşmak için gereken dönem ortalamasını, minimum harf
  notunu ve örnek not kombinasyonlarını bulma.
- TR / EN dil desteği, açık/koyu tema, çevrimdışı çalışma (PWA), `localStorage` ile kalıcılık.

## Teknik yığın

Vite + React 19 + TypeScript + Tailwind CSS v4. Test: Vitest. Lint: oxlint.

```bash
npm install
npm run dev       # geliştirme sunucusu (http://localhost:5173)
npm run build     # tsc + production build
npm run test      # hesaplama motoru + doğrulayıcı birim testleri
npm run lint
```

## Mimari

```
src/
  lib/                 # saf, framework'ten bağımsız çekirdek
    grades.ts          # Koç harf notu skalası (katsayılar, GPA'ya giren/girmeyen notlar)
    gpa.ts             # Hesaplama motoru: calcGpaFromCourses / projectGpa / requiredTermGpa
    semesters.ts       # Dönem serisi: SPA + kümülatif GPA
    standing.ts        # "Mevcut durum" çözümlemesi (basit / detaylı giriş)
    transcript.ts      # Yapıştırılan transkript metnini ayrıştıran sezgisel parser
    validate.ts        # Kalıcı veriyi doğrulayan parser'lar (güvenlik sınırı)
    storage.ts         # Sürümlü localStorage + clearAppData()
    config.ts          # Alan adı, kaynaklar, doğrulama tarihi
    i18n.tsx           # TR/EN sözlük + provider
    *.test.ts          # 44 birim testi (kritik — önce burayı çalıştır)
  components/
    tabs/              # ProjectionTab, ScratchTab, SemestersTab, TargetTab
    ui.tsx, CourseList, CurrentStanding, GradeSelect, GpaVisual, GpaTrendChart,
    ResultParts, MobileResultBar, Header, InfoPanel, PrivacyFooter, ErrorBoundary
public/
  fonts/               # self-host edilmiş Inter + Fraunces (latin + latin-ext)
  theme.js             # ilk boyamadan önce temayı uygular (FOUC yok)
  sw.js                # service worker (çevrimdışı)
```

Hesaplama mantığı UI'dan tamamen ayrıdır (`src/lib/`), böylece test edilebilir ve
ileride başka üniversiteler / bir API için yeniden kullanılabilir.

### Kalıcı veri bir güvenlik sınırıdır

`localStorage`'dan okunan her şey **güvenilmeyen girdi** olarak ele alınır: eski bir sürümden
kalmış, yarım yazılmış veya elle değiştirilmiş olabilir. `validate.ts` içindeki parser'lar
tanımadıkları her değeri reddeder ve varsayılana döner. Bu olmadan tek bir bozuk kayıt her
render'da hata fırlatır, "yenile" aynı kaydı tekrar okur ve uygulama kalıcı olarak kilitlenir.
Şema değiştiğinde `storage.ts` içindeki `STORAGE_VERSION`'ı artır.

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
- **Ders tekrarı:** Varsayılan "en yüksek harf notu sayılır, krediler bir kez sayılır".
  Ancak notun değiştirilmesi her durumda otomatik değildir (bazı durumlarda dilekçe gerekir),
  bu yüzden kural arayüzden seçilebilir ve uygulama kullanıcıyı Öğrenci İşleri'ne yönlendirir.
- **Eşikler:** Mezuniyet ≥ 2.00 (kümülatif).
- **Onur listeleri** dönem ortalamasına (SPA) göre belirlenir, kümülatife göre değil:
  Vehbi Koç Onur Listesi SPA ≥ 3.75 · Dekan Şeref Listesi SPA ≥ 3.25 **ve** kümülatif ≥ 3.25.

Kurallar en son **26 Eylül 2026** tarihinde resmî kaynaklarla karşılaştırıldı
(`RULES_VERIFIED_ON`, `src/lib/config.ts`). Kaynak listesi aynı dosyada ve uygulama içindeki
bilgi panelinde görünür.

### Kaynaklar

- [Koç University — Grading Scale (Academic Council 2020/07)](https://cssh.ku.edu.tr/en/about/faculty-resources/grading-scale/)
- [Koç University — Registrar's and Student Affairs Directorate](https://registrar.ku.edu.tr/en/)

## Yapılandırma

Tüm ayarlar `.env` içinde; hepsi herkese açık, sır değil.

| Değişken | Ne işe yarar |
|---|---|
| `VITE_SITE_URL` | canonical, hreflang, OG, JSON-LD ve sitemap adreslerinin tek kaynağı. **Yalnızca sahibi olduğun alan adını yaz.** Boşsa bu etiketler hiç basılmaz. |
| `VITE_PLAUSIBLE_DOMAIN` | Boş = analytics kapalı, üçüncü taraf istek yok. Doldurunca Plausible (çerezsiz) yüklenir. |
| `VITE_FEEDBACK_URL` | Footer'daki geri bildirim bağlantısı. Boşsa bağlantı gizlenir. |

## Güvenlik ve gizlilik

- **Backend yok, hesap yok, çerez yok.** Girilen notlar cihazdan çıkmaz.
- **Üçüncü taraf yok.** Fontlar self-host edilir (eskiden Google Fonts'tan geliyordu ve her
  ziyaretçinin IP'si Google'a gidiyordu). Analytics varsayılan olarak kapalıdır.
- **Güvenlik başlıkları** `netlify.toml` ve `vercel.json` içinde: CSP, `frame-ancestors 'none'`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Veri silme:** Footer'daki düğme uygulamanın yazdığı tüm anahtarları temizler; hata ekranında
  da bir kurtarma düğmesi vardır.
- CSP `style-src` içinde `'unsafe-inline'` bulunur — React inline `style` özniteliği kullanıyor.
  Plausible'ı açarsan `script-src` ve `connect-src`'ye `https://plausible.io` eklemen gerekir.

## Yayına alma (Deploy)

Statik bir SPA — build çıktısı `dist/`. Konfig hazır (`netlify.toml`, `vercel.json`,
`public/site.webmanifest`, OG görselleri, robots + sitemap otomatik üretilir).

**Vercel:**
```bash
npx vercel --prod
```

**Netlify:**
```bash
npx netlify-cli deploy --build --prod
```

**Cloudflare Pages / diğer:** build komutu `npm run build`, çıktı klasörü `dist`.
Güvenlik başlıklarını o platformun kendi yapılandırmasına taşımayı unutma.

**Deploy sonrası:**
- OG önizlemesini test et: [opengraph.xyz](https://www.opengraph.xyz)
- Başlıkları doğrula: [securityheaders.com](https://securityheaders.com)
- Kendi alan adına geçince `VITE_SITE_URL`'i güncelle ve eski adresten 301 yönlendirmesi kur.

### Transkript ayrıştırma

Tek bir transkript biçimi yok: sütun sırası, ayraçlar ve dil değişiyor, PDF'ten kopyalanan metin
düzensiz boşluklarla geliyor. `transcript.ts` bu yüzden **sezgisel ama sesli** çalışır — okuyamadığı
her satırı `skipped` içinde geri döndürür, belirsizlikleri (özellikle Koç kredisi ile ECTS'in yan
yana olduğu satırları) bildirir ve hiçbir şey onay ekranı gösterilmeden içe aktarılmaz. Sessizce
tahmin yürütmek, hiç ayrıştırmamaktan kötü olurdu: yanlış okunan bir kredi tüm ortalamayı bozar.

Yeni bir transkript biçimiyle karşılaşırsan `transcript.test.ts`'e o biçimden bir örnek ekle.

## Yol haritası

- Paylaşılabilir sonuç bağlantısı / görsel sonuç kartı.
- Burs ve onur eşiği takibi.
- Diğer üniversitelerin not sistemleri (`grades.ts`'i çoklu skalaya çevirip seçilebilir yapmak).
