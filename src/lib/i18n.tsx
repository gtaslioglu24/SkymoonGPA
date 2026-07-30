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
    retakeHint: 'Bu dersi daha önce almıştın — Koç kuralına göre yüksek not sayılır.',
    empty: 'Henüz ders eklemedin.',
    emptyCta: 'Başlamak için “Ders ekle”ye dokun.',
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
    honor: 'Vehbi Koç Onur Öğrencisi eşiğindesin (3.50+).',
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
  footer: {
    rights: 'Tüm hakları saklıdır.',
  },
  info: {
    scaleTitle: 'Koç harf notu skalası',
    nonGpaTitle: 'GPA’ya girmeyen notlar',
    nonGpaBody:
      'S, U, P, W ve benzeri idari notlar ortalamaya katılmaz. F notu ise 0.00 olarak ortalamaya girer.',
    creditNote: 'Kredi = Koç kredisi (ECTS değil). Transkriptteki “Credit/Kredi” sütununu kullan.',
    disclaimer:
      'Gayriresmî bir araçtır. Sonuçlar tahminidir; resmî ortalaman için transkriptini ve Öğrenci İşleri’ni esas al.',
  },
  common: {
    points: 'katsayı',
    theme: 'Tema',
    language: 'Dil',
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
    retakeHint: 'You took this before — per Koç rules the higher grade counts.',
    empty: 'No courses yet.',
    emptyCta: 'Tap “Add course” to get started.',
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
    honor: 'You’re at the Vehbi Koç Scholar threshold (3.50+).',
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
  footer: {
    rights: 'All rights reserved.',
  },
  info: {
    scaleTitle: 'Koç letter-grade scale',
    nonGpaTitle: 'Grades excluded from GPA',
    nonGpaBody:
      'S, U, P, W and similar administrative grades don’t enter the average. An F counts as 0.00 in the GPA.',
    creditNote: 'Credit = KU credit (not ECTS). Use the “Credit” column on your transcript.',
    disclaimer:
      'This is an unofficial tool. Results are estimates; rely on your transcript and the Registrar for your official GPA.',
  },
  common: {
    points: 'points',
    theme: 'Theme',
    language: 'Language',
  },
};

const dictionaries: Record<Lang, Dict> = { tr, en };

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'koc-gpa:lang';

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'tr';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'tr' || saved === 'en') return saved;
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'tr';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
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
