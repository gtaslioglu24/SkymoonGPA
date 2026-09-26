import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'tr' | 'en';

const tr = {
  app: {
    title: 'Skymoon GPA',
    tagline: 'Not ortalamanı hesapla & simüle et',
    subtitle:
      'Bu dönem alacağın notlara göre genel ortalamanın (CGPA) nasıl değişeceğini anında gör.',
  },
  tabs: {
    projection: 'Simülasyon',
    scratch: 'Sıfırdan Hesapla',
    target: 'Hedef GPA',
    semesters: 'Dönemler',
  },
  tabsDesc: {
    projection: 'Mevcut GPA’ne planladığın dersleri ekle',
    scratch: 'Tüm derslerini girip ortalamanı bul',
    target: 'İstediğin ortalama için ne gerektiğini gör',
    semesters: 'Dönemleri gir, GPA’nın nasıl değiştiğini gör',
  },
  semesters: {
    term: 'Dönem',
    chartTitle: 'GPA gelişimi',
    chartDesc:
      '{n} dönem boyunca kümülatif GPA: ilk dönem {first}, son dönem {last}. Aynı veriler aşağıdaki tabloda da var.',
    overall: 'Genel GPA',
    spa: 'Dönem (SPA)',
    cumulative: 'Kümülatif',
    addSemester: 'Dönem ekle',
    removeSemester: 'Dönemi sil',
    namePlaceholder: 'Örn. 2024 Güz',
    chartEmpty: 'Grafik için en az bir not girilmiş dönem ekle.',
  },
  standing: {
    title: 'Mevcut Durumun',
    simple: 'Basit',
    detailed: 'Detaylı',
    simpleHint: 'Transkriptteki iki sayıyı gir',
    detailedHint: 'Geçmiş dersleri tek tek gir',
    currentGpa: 'Mevcut GPA (CGPA)',
    currentCredits: 'Toplam kredi',
    currentCreditsHint: 'GPA’ya giren (harf notlu) toplam kredin',
    computedFromCourses: 'Aşağıdaki derslerden hesaplandı',
    pastCourses: 'Geçmiş dersler',
  },
  courses: {
    plannedTitle: 'Bu Dönem — Planladığın Dersler',
    listTitle: 'Dersler',
    add: 'Ders ekle',
    name: 'Ders adı',
    namePlaceholder: 'Örn. MATH 106',
    credits: 'Kredi',
    grade: 'Not',
    remove: 'Sil',
    retake: 'Tekrar (retake)',
    retakeShort: 'Tekrar',
    previousGrade: 'Önceki not',
    retakeHint:
      'Bu dersi daha önce almıştın. Tekrar kuralını aşağıdan seç — değiştirme her durumda otomatik değildir, Öğrenci İşleri’ne teyit ettir.',
    empty: 'Henüz ders eklemedin.',
    emptyCta: 'Başlamak için “Ders ekle”ye dokun.',
  },
  repeat: {
    title: 'Ders tekrarı kuralı',
    highest: 'En yüksek not sayılır',
    last: 'Son alınan not sayılır',
    all: 'Tüm denemeler ortalamada kalır',
    hint: 'Koç’ta tekrar edilen dersin notunun değiştirilmesi bazı durumlarda dilekçeye bağlıdır. Emin değilsen Öğrenci İşleri’ne sor; buradaki seçim yalnızca hesabı etkiler.',
  },
  result: {
    current: 'Mevcut GPA',
    projected: 'Tahmini Yeni GPA',
    computed: 'Hesaplanan GPA',
    termGpa: 'Bu dönem (SPA)',
    change: 'Değişim',
    up: 'yükseliyor',
    down: 'düşüyor',
    same: 'aynı kalıyor',
    addedCredits: 'eklenen kredi',
    totalCredits: 'toplam kredi',
    earnedCredits: 'kazanılan kredi',
    gpaCredits: 'GPA kredisi',
    enterToSee: 'Sonucu görmek için ders ekle',
    enterStanding: 'Önce mevcut GPA’nı ve toplam kredini gir',
    vehbiKoc: 'Vehbi Koç Onur Belgesi eşiğindesin (3.75+).',
    deansHonor: 'Dekan Onur Belgesi eşiğindesin (3.25+).',
    safe: 'Mezuniyet eşiğinin (2.00) üzerindesin.',
    warning: 'Mezuniyet eşiğinin (2.00) altındasın — dikkat.',
  },
  target: {
    title: 'Hedefine Ulaşmak İçin',
    plannedCredits: 'Bu dönem alınacak kredi',
    targetGpa: 'Hedef GPA',
    required: 'Gereken dönem ortalaması',
    examplesTitle: 'Örnek not kombinasyonları',
    exampleNote:
      'Eşit kredili ders varsayımıyla. Dönem ortalaman bu değere ulaştığı sürece hangi dağılımı seçersen seç hedefe varırsın.',
    maxReachable: 'Bu dönem ulaşılabilecek en yüksek GPA',
    ok: 'Bu hedef ulaşılabilir.',
    guaranteed: 'Bu hedef şu an garanti — düşük notlar bile seni altına indirmez.',
    impossible: 'Bu hedefe tek dönemde ulaşmak matematiksel olarak mümkün değil.',
    noCredits: 'Bir sonuç için bu döneme ait kredi gir.',
  },
  doubleMajor: {
    toggle: 'Çift anadal (ÇAP)',
    program: 'Program',
    major: 'Anadal',
    double: 'ÇAP',
    both: 'İkisi',
    majorGpa: 'Anadal GPA',
    doubleGpa: 'ÇAP GPA',
    note: 'Her dersi hangi programa saydığını seç; her program için ayrı ortalama hesaplanır. “İkisi” dersler iki ortalamaya da girer.',
  },
  transcript: {
    open: 'Transkript yapıştır',
    title: 'Transkriptten içe aktar',
    hint: 'KUSIS’teki tabloyu ya da PDF transkriptini seçip kopyala, buraya yapıştır.',
    placeholder: `2023-2024 Güz\nMATH 106  Matematik II  4  6  A-\nCOMP 200  Bilgisayar Bilimlerine Giriş  3  6  B+`,
    privacy:
      'Yapıştırdığın metin cihazından çıkmaz, hiçbir yere gönderilmez ve kaydedilmez — yalnızca tarayıcında okunur.',
    preview: 'Bulunan dersler',
    previewTruncated:
      'Liste uzun olduğu için ilk 300 satır gösteriliyor. Kalan {n} ders de içe aktarılacak.',
    coursesFound: '{n} ders, {s} dönem bulundu',
    noneFound:
      'Bu metinde ders satırı bulunamadı. Ders kodu, kredi ve harf notunun aynı satırda olduğu bir bölüm yapıştırmayı dene.',
    creditColumnTitle: 'Kredi sütunu',
    creditSmaller: 'Küçük olan (Koç kredisi)',
    creditLarger: 'Büyük olan (ECTS)',
    creditHint:
      'Bazı satırlarda iki sayı var — genelde Koç kredisi ve ECTS. Koç ortalaması Koç kredisiyle hesaplanır, bu yüzden varsayılan küçük olandır. Önizlemedeki sayılar transkriptindeki “Kredi” sütunuyla uyuşmuyorsa buradan değiştir.',
    excludedTitle: 'Ortalamaya girmeyen {n} ders atlandı',
    excludedHint:
      'Transkriptinde ders kodunun başında “*” olan dersler genel not ortalamasına dahil edilmiyor — tekrar ettiğin bir dersin eski notu ya da ortalamaya hiç girmeyen dersler. Belgedeki kurala uyduk, bu yüzden içe aktarılmadılar.',
    skippedTitle: 'Okunamayan {n} satır',
    skippedHint: 'Bu satırlar içe aktarılmayacak. Aralarında ders varsa elle ekleyebilirsin.',
    duplicateTitle: 'Tekrar eden ders',
    duplicateHint:
      'aynı ders birden fazla kez görünüyor. Bu sekme tüm denemeleri ortalamaya katar; resmî CGPA’nda tekrar kuralı farklı işleyebilir.',
    summaryFound:
      'Transkriptte kümülatif GPA {gpa} ve toplam {credits} kredi bulundu. Bunları “Mevcut Durumun” alanına kendin girebilirsin.',
    summaryGpaOnly:
      'Transkriptte kümülatif GPA {gpa} bulundu. Bunu “Mevcut Durumun” alanına kendin girebilirsin.',
    summaryCreditsOnly:
      'Transkriptte toplam {credits} kredi bulundu. Bunu “Mevcut Durumun” alanına kendin girebilirsin.',
    unnamedSemester: 'Dönem adı yok',
    modeLabel: 'İçe aktarma biçimi',
    modeAppend: 'Mevcutlara ekle',
    modeReplace: 'Mevcutları değiştir',
    import: '{n} dersi içe aktar',
    clear: 'Temizle',
    cancel: 'Kapat',
    undo: 'Geri al',
  },
  footer: {
    rights: 'Tüm hakları saklıdır.',
  },
  privacy: {
    notice:
      'Girdiğin hiçbir bilgi sunucuya gönderilmez; veriler yalnızca bu tarayıcıda saklanır. Ortak bir bilgisayardaysan işin bitince verilerini sil.',
    clearData: 'Verilerimi sil',
    confirmClear: 'Evet, hepsini sil',
    cancel: 'Vazgeç',
    feedback: 'Hata bildir / geri bildirim',
  },
  info: {
    scaleTitle: 'Koç harf notu skalası',
    nonGpaTitle: 'GPA’ya girmeyen notlar',
    nonGpaBody:
      'S, U, P, W ve benzeri idari notlar ortalamaya katılmaz. F notu ise 0.00 olarak ortalamaya girer.',
    repeatTitle: 'Ders tekrarı',
    repeatBody:
      'Simülasyon sekmesinde tekrar kuralını seçebilirsin. Varsayılan “en yüksek not sayılır”; ancak notun değiştirilmesi bazı durumlarda dilekçe gerektirir, bu yüzden resmî durumu Öğrenci İşleri’nden teyit et.',
    creditNote: 'Kredi = Koç kredisi (ECTS değil). Transkriptteki “Credit/Kredi” sütununu kullan.',
    verifiedOn: 'Buradaki kurallar {date} tarihinde resmî kaynaklarla karşılaştırıldı.',
    disclaimer:
      'Gayriresmî bir araçtır. Sonuçlar tahminidir; resmî ortalaman için transkriptini ve Öğrenci İşleri’ni esas al.',
  },
  common: {
    points: 'katsayı',
    theme: 'Tema',
    themeToDark: 'Koyu temaya geç',
    themeToLight: 'Açık temaya geç',
    language: 'Dil',
    skipToContent: 'İçeriğe geç',
    tabsLabel: 'Hesaplama modu',
  },
};

type Dict = typeof tr;

const en: Dict = {
  app: {
    title: 'Skymoon GPA',
    tagline: 'Calculate & simulate your GPA',
    subtitle:
      'See instantly how your cumulative GPA (CGPA) shifts based on the grades you expect this term.',
  },
  tabs: {
    projection: 'Simulation',
    scratch: 'Calculate GPA',
    target: 'Target GPA',
    semesters: 'Semesters',
  },
  tabsDesc: {
    projection: 'Add planned courses to your current GPA',
    scratch: 'Enter all your courses to get your average',
    target: 'See what it takes to reach a target average',
    semesters: 'Enter your semesters and watch your GPA evolve',
  },
  semesters: {
    term: 'Semester',
    chartTitle: 'GPA over time',
    chartDesc:
      'Cumulative GPA across {n} semesters: {first} at the start, {last} most recently. The same figures appear in the table below.',
    overall: 'Overall GPA',
    spa: 'Term (SPA)',
    cumulative: 'Cumulative',
    addSemester: 'Add semester',
    removeSemester: 'Remove semester',
    namePlaceholder: 'e.g. Fall 2024',
    chartEmpty: 'Add at least one semester with a grade to see the chart.',
  },
  standing: {
    title: 'Your Current Standing',
    simple: 'Simple',
    detailed: 'Detailed',
    simpleHint: 'Enter the two numbers from your transcript',
    detailedHint: 'Enter your past courses one by one',
    currentGpa: 'Current GPA (CGPA)',
    currentCredits: 'Total credits',
    currentCreditsHint: 'Total letter-graded credits counted in your GPA',
    computedFromCourses: 'Computed from the courses below',
    pastCourses: 'Past courses',
  },
  courses: {
    plannedTitle: 'This Term — Planned Courses',
    listTitle: 'Courses',
    add: 'Add course',
    name: 'Course name',
    namePlaceholder: 'e.g. MATH 106',
    credits: 'Credits',
    grade: 'Grade',
    remove: 'Remove',
    retake: 'Retake',
    retakeShort: 'Retake',
    previousGrade: 'Previous grade',
    retakeHint:
      'You took this before. Pick the repeat rule below — replacement is not automatic in every case, so confirm with the Registrar.',
    empty: 'No courses yet.',
    emptyCta: 'Tap “Add course” to get started.',
  },
  repeat: {
    title: 'Repeat rule',
    highest: 'Highest attempt counts',
    last: 'Most recent attempt counts',
    all: 'Every attempt stays in the average',
    hint: 'At Koç, replacing the grade of a repeated course can require a petition. If you are unsure, ask the Registrar — this setting only changes the arithmetic here.',
  },
  result: {
    current: 'Current GPA',
    projected: 'Projected New GPA',
    computed: 'Calculated GPA',
    termGpa: 'This term (SPA)',
    change: 'Change',
    up: 'going up',
    down: 'going down',
    same: 'unchanged',
    addedCredits: 'added credits',
    totalCredits: 'total credits',
    earnedCredits: 'earned credits',
    gpaCredits: 'GPA credits',
    enterToSee: 'Add a course to see the result',
    enterStanding: 'First enter your current GPA and total credits',
    vehbiKoc: 'You’re at the Vehbi Koç Honour List threshold (3.75+).',
    deansHonor: 'You’re at the Dean’s Honour List threshold (3.25+).',
    safe: 'You’re above the graduation threshold (2.00).',
    warning: 'Below the graduation threshold (2.00) — watch out.',
  },
  target: {
    title: 'To Reach Your Target',
    plannedCredits: 'Credits planned this term',
    targetGpa: 'Target GPA',
    required: 'Required term average',
    examplesTitle: 'Example grade mixes',
    exampleNote:
      'Assuming equal-credit courses. Any distribution that reaches this term average will hit your target.',
    maxReachable: 'Highest GPA reachable this term',
    ok: 'This target is achievable.',
    guaranteed: 'This target is already guaranteed — even low grades won’t drop you below it.',
    impossible: 'Reaching this target in a single term is mathematically impossible.',
    noCredits: 'Enter this term’s credits to get a result.',
  },
  doubleMajor: {
    toggle: 'Double major',
    program: 'Program',
    major: 'Major',
    double: 'Double',
    both: 'Both',
    majorGpa: 'Major GPA',
    doubleGpa: 'Double-major GPA',
    note: 'Tag each course to a program; a separate GPA is computed for each. “Both” courses count toward both averages.',
  },
  transcript: {
    open: 'Paste transcript',
    title: 'Import from transcript',
    hint: 'Select the table in KUSIS or your PDF transcript, copy it, and paste it here.',
    placeholder: `Fall 2023-2024\nMATH 106  Calculus II  4  6  A-\nCOMP 200  Introduction to Computer Science  3  6  B+`,
    privacy:
      'The text you paste never leaves your device, is never sent anywhere, and is not saved — it is only read in your browser.',
    preview: 'Courses found',
    previewTruncated:
      'The list is long, so only the first 300 rows are shown. The remaining {n} courses will still be imported.',
    coursesFound: 'Found {n} courses across {s} semesters',
    noneFound:
      'No course rows found in this text. Try pasting a section where the course code, credits and letter grade sit on the same line.',
    creditColumnTitle: 'Credit column',
    creditSmaller: 'The smaller one (KU credit)',
    creditLarger: 'The larger one (ECTS)',
    creditHint:
      'Some rows have two numbers — usually KU credit and ECTS. Koç GPA is weighted by KU credit, so the smaller one is used by default. If the preview does not match the “Credit” column on your transcript, switch it here.',
    excludedTitle: '{n} courses left out of the average',
    excludedHint:
      'Courses whose code is prefixed with “*” on your transcript are not included in the cumulative GPA — an earlier attempt at a course you repeated, or a course that never counts. We followed the document’s own rule, so they were not imported.',
    skippedTitle: '{n} lines could not be read',
    skippedHint: 'These will not be imported. If any of them are courses, add them by hand.',
    duplicateTitle: 'Repeated course',
    duplicateHint:
      'appears more than once. This tab counts every attempt; your official CGPA may apply a repeat rule instead.',
    summaryFound:
      'The transcript states a cumulative GPA of {gpa} over {credits} credits. You can enter those under “Your Current Standing”.',
    summaryGpaOnly:
      'The transcript states a cumulative GPA of {gpa}. You can enter it under “Your Current Standing”.',
    summaryCreditsOnly:
      'The transcript states {credits} total credits. You can enter it under “Your Current Standing”.',
    unnamedSemester: 'Unnamed semester',
    modeLabel: 'Import mode',
    modeAppend: 'Add to existing',
    modeReplace: 'Replace existing',
    import: 'Import {n} courses',
    clear: 'Clear',
    cancel: 'Close',
    undo: 'Undo',
  },
  footer: {
    rights: 'All rights reserved.',
  },
  privacy: {
    notice:
      'Nothing you type is sent to a server; it stays in this browser only. On a shared computer, clear your data when you’re done.',
    clearData: 'Delete my data',
    confirmClear: 'Yes, delete everything',
    cancel: 'Cancel',
    feedback: 'Report a problem / feedback',
  },
  info: {
    scaleTitle: 'Koç letter-grade scale',
    nonGpaTitle: 'Grades excluded from GPA',
    nonGpaBody:
      'S, U, P, W and similar administrative grades don’t enter the average. An F counts as 0.00 in the GPA.',
    repeatTitle: 'Repeated courses',
    repeatBody:
      'The Simulation tab lets you pick the repeat rule. The default is "highest attempt counts", but replacing a grade can require a petition — confirm your own case with the Registrar.',
    creditNote: 'Credit = KU credit (not ECTS). Use the “Credit” column on your transcript.',
    verifiedOn: 'These rules were last checked against official sources on {date}.',
    disclaimer:
      'This is an unofficial tool. Results are estimates; rely on your transcript and the Registrar for your official GPA.',
  },
  common: {
    points: 'points',
    theme: 'Theme',
    themeToDark: 'Switch to dark theme',
    themeToLight: 'Switch to light theme',
    language: 'Language',
    skipToContent: 'Skip to content',
    tabsLabel: 'Calculation mode',
  },
};

const dictionaries: Record<Lang, Dict> = { tr, en };

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'skymoon-gpa:lang';

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'tr';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'tr' || saved === 'en') return saved;
  } catch {
    /* storage disabled */
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'tr';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage disabled */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
