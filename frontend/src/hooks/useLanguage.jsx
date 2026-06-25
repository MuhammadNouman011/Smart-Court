import { createContext, useContext, useEffect, useState } from 'react'

const LanguageCtx = createContext(null)

const STRINGS = {
  en: {
    // brand
    appName: 'Smart Court',
    tagline: '',
    sovereignTagline: "Pakistan's first sovereign legal AI",

    // sidebar
    navHome: 'Home',
    navChat: 'Legal Q&A',
    navScanner: 'Contract Scanner',
    navDrafter: 'Document Drafter',
    navCourtroom: 'Courtroom',
    navHistory: 'History',
    sidebarNav: 'Navigation',
    sidebarAccount: 'Account',
    login: 'Sign in',
    signup: 'Create account',
    logout: 'Sign out',
    profile: 'Profile',
    guest: 'Guest',

    // hero
    heroLine1: 'Know your',
    heroLineSov: 'rights',
    heroLine2: 'in your language.',
    heroDesc:
      'Smart Court retrieves the actual Pakistani statute, explains it in your language, and tells you what to do next with citations, a case strength score, and a step by step plan.',
    cta: 'Start a consultation',
    secondaryCta: 'Enter the courtroom',
    chapterIntro: 'Capabilities',
    chapterIntroSub: 'A complete legal toolkit. One sovereign AI.',
    realLawInside: 'Real Pakistani law inside',
    finalCtaHeading: 'Knowing your rights is',
    finalCtaItalic: 'not a privilege.',
    finalCtaSub:
      "Step into Pakistan's first sovereign legal AI. Free, private, accurate in your language.",
    finalCtaButton: 'Open Smart Court',
    begin: 'Begin',

    // feature cards
    cap01: '01 · Q&A',
    cap02: '02 · Contract',
    cap03: '03 · Documents',
    cap04: '04 · Rehearsal',
    cap00: '00 · Voice',
    cap05: '05 · Faraid',
    capPrivacy: 'By design',
    capOpen: 'Open',
    fInquiry: 'Inquiry',
    fInquiryDesc:
      'Smart Court retrieves the exact statute that applies, replies in your language, and shows a case strength score with a step by step action plan.',
    fScanner: 'Scanner',
    fScannerDesc:
      'Drop any PDF. Smart Court flags unfair clauses and cites which Pakistani statute they violate.',
    fDrafter: 'Drafter',
    fDrafterDesc:
      'FIR, legal notices, affidavits and complaint letters. Drafted in formal register, exported as Word or PDF.',
    fCourtroom: 'Courtroom',
    fCourtroomDesc:
      'Stand before an AI Pakistani judge. Get a written verdict with strengths, weaknesses and feedback before stepping into a real court.',
    fVoice: 'Voice',
    fVoiceDesc: 'Speak your question. The audio is transcribed locally and answered with the same legal pipeline.',
    fInheritance: 'Inheritance',
    fInheritanceDesc:
      "Enter the surviving family and Smart Court computes every heir's exact share under Islamic law, with an animated breakdown and Qur'anic citations.",
    fPrivacy: 'Private by design',
    fPrivacyDesc:
      'Your conversation never leaves your laptop. No cloud, no logging, no data collection. Press Ctrl+K anywhere to command the app.',

    // chat
    askPlaceholder: 'Describe your legal matter',
    send: 'Send',
    speak: 'Speak',
    listening: 'Listening',
    thinking: 'Smart Court is thinking',
    actionPlan: 'Action plan',
    citations: 'Citations',
    caseStrength: 'Case strength',
    sources: 'Sources retrieved',
    warning: 'Disclaimer',
    welcomeHeading: 'What can I help you understand today?',
    welcomeDesc:
      'Smart Court retrieves the relevant Pakistani statute and gives a clear opinion with citations and a step by step plan.',
    placeYourMatter: 'Place your matter',
    inquiryTitle: 'Ask a legal question',
    inquiryDesc:
      'Smart Court retrieves the relevant Pakistani statutes and gives a clear opinion grounded in law, with citations and a step by step action plan.',
    composerHint: 'Shift + Enter for new line',
    statusReady: 'Ready',
    statusWriting: 'Writing',
    youLabel: 'You',
    aiLabel: 'Smart Court',
    readingStatutes: 'Reading the statute books',
    follow: 'Follow',
    noCitations: 'No citations yet.',
    noSources: 'Sources will appear here after a query.',

    // scanner
    scanDrop: 'Drop a PDF contract',
    scanOr: 'or click to browse',
    redFlags: 'Red flags found',
    recommendations: 'Recommendations',
    summary: 'Summary',
    riskScore: 'Risk score',
    scanForRedFlags: 'Scan for red flags',
    scanning: 'Scanning',
    scannerTitle: 'Find unfair contract clauses',
    scannerDesc:
      'Upload any PDF contract. Smart Court highlights every red flag with the specific Pakistani statute it bumps against.',
    changeFile: 'Change',
    analysingClauses: 'Analysing clauses',
    emptyScanState: 'Upload a contract on the left to see red flags here.',

    // drafter
    drafter: 'Document Drafter',
    drafterCta: 'Generate draft',
    drafting: 'Drafting',
    downloadPdf: 'Download PDF',
    downloadDocx: 'Download Word',
    livePreview: 'Live preview',
    docType: 'Document type',
    drafterTitle: 'Court ready documents',
    drafterDesc:
      'Fill a short form. Smart Court drafts a complete FIR application, legal notice, affidavit or complaint letter in formal register.',
    drafterEmpty: 'Fill the form and press Generate draft to see your document here.',

    // courtroom
    courtroomTitle: 'Rehearse before an AI judge',
    courtroomDesc:
      'Before stepping into a real court, present your case to an AI Pakistani judge. End with a written verdict, strengths, weaknesses and feedback.',
    courtroomIntro: 'Rehearse your case against an AI Pakistani judge before stepping into a real court.',
    presentCase: 'Begin hearing',
    requestVerdict: 'Request verdict',
    verdict: 'Verdict',
    strengths: 'Strengths',
    weaknesses: 'Weaknesses',
    feedback: 'Feedback',
    newCase: 'New case',
    summariseCase: 'Summarise your case in two to four sentences',

    // history
    historyTitle: 'Your conversations',
    historyDesc: 'Every consultation you have had with Smart Court. Click to reopen.',
    historyEmpty: 'No conversations yet.',
    historyOpen: 'Open',
    historyDelete: 'Delete',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    justNow: 'just now',

    // auth
    authSigninTitle: 'Welcome back',
    authSigninSub: 'Sign in to your Smart Court account.',
    authSignupTitle: 'Create your account',
    authSignupSub: 'A free account for free legal guidance.',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    submitSignin: 'Sign in',
    submitSignup: 'Create account',
    haveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    signinLink: 'Sign in',
    signupLink: 'Create one',
    signedInAs: 'Signed in as',
    or: 'or',
    forgotPassword: 'Forgot password?',

    // categories (legal areas)
    catTenant:   'Tenant',
    catLabour:   'Labour',
    catFamily:   'Family',
    catCriminal: 'Criminal',
    catConsumer: 'Consumer',
    catGeneral:  'General',

    // severities
    sevCritical: 'critical',
    sevHigh:     'high',
    sevMedium:   'medium',
    sevLow:      'low',

    // chat shell
    caseFile:         'Case',
    consideredOpinion:'Considered opinion',
    addressPlaceholder:'Address the Court',
    sessionInProgress:'Session in progress',
    sessionEnded:     'Session ended',
    honJustice:       'Hon. Justice',
    procedure:        'Procedure',
    procStep1:        'Open with the facts and the parties',
    procStep2:        'Cite the statutes you rely on',
    procStep3:        'Answer the bench directly',
    procStep4:        'Conclude with the relief you seek',
    procStep5:        'Request a verdict when ready',
    aboutCourtroomTip:
      'The judge is strict but fair. Treat adverse remarks as a chance to strengthen your case.',
    tryIt:            'Try',
    suggestedMatters: 'Suggested matters',
    openCourt:        'The Court is now in session',
    fromCitizen:      'From the citizen',
    fileEverythingEnter: 'Press Enter to file. Shift + Enter for a new line.',
    deliberating:     'Deliberating',
    consultLater:     'Consult a licensed lawyer for binding advice.',

    // inheritance
    navInheritance:  'Inheritance',
    wirasatTitle:    'Islamic inheritance calculator',
    wirasatDesc:     'Enter the surviving family and the estate value. Smart Court computes each heir\'s exact share under Islamic law and the Muslim Family Laws Ordinance.',
    whoSurvives:     'Who survives the deceased?',
    spouseLabel:     'Spouse',
    spouseNone:      'None',
    spouseHusband:   'Husband',
    spouseWife:      'Wife / Wives',
    wivesCount:      'Number of wives',
    sonsLabel:       'Sons',
    daughtersLabel:  'Daughters',
    fatherLabel:     'Father alive',
    motherLabel:     'Mother alive',
    brothersLabel:   'Full brothers',
    sistersLabel:    'Full sisters',
    estateLabel:     'Estate value (PKR, optional)',
    calculateShares: 'Calculate shares',
    sharesResult:    'Distribution of shares',
    heirCol:         'Heir',
    shareCol:        'Share',
    percentCol:      'Percent',
    amountCol:       'Amount',
    perPerson:       'each',
    awlApplied:      'Awl applied — shares scaled proportionally',
    raddApplied:     'Radd applied — surplus returned to blood heirs',
    wirasatEmpty:    'Add at least one surviving heir to calculate.',
    wirasatDisclaimer: 'This calculator covers common cases. Complex situations (grandparents, orphaned grandchildren, mixed siblings) should be confirmed with a scholar or lawyer.',
    basisLabel:      'Basis',

    // misc
    free: 'Free',
    learnMore: 'Learn more',
    openInquiry: 'Open',
  },
  ur: {
    // brand
    appName: 'اسمارٹ کورٹ',
    tagline: '',
    sovereignTagline: 'پاکستان کا پہلا خودمختار قانونی اے آئی',

    // sidebar
    navHome: 'صفحہ اول',
    navChat: 'قانونی مشورہ',
    navScanner: 'معاہدہ اسکینر',
    navDrafter: 'دستاویز سازی',
    navCourtroom: 'مشقی عدالت',
    navHistory: 'پرانی گفتگو',
    sidebarNav: 'فہرست',
    sidebarAccount: 'اکاؤنٹ',
    login: 'لاگ اِن',
    signup: 'اکاؤنٹ بنائیں',
    logout: 'لاگ آؤٹ',
    profile: 'پروفائل',
    guest: 'مہمان',

    // hero
    heroLine1: 'اپنے',
    heroLineSov: 'حقوق',
    heroLine2: 'اپنی زبان میں جانیے۔',
    heroDesc:
      'اردو یا انگریزی میں سوال کیجیے۔ اسمارٹ کورٹ پاکستانی قانون کی متعلقہ دفعات تلاش کر کے واضح جواب، حوالہ جات، مقدمے کی مضبوطی کا اسکور اور قدم بہ قدم لائحہ عمل پیش کرتا ہے۔',
    cta: 'مشورہ شروع کریں',
    secondaryCta: 'مشقی عدالت میں جائیں',
    chapterIntro: 'صلاحیتیں',
    chapterIntroSub: 'مکمل قانونی ٹول کٹ، ایک خودمختار اے آئی۔',
    realLawInside: 'حقیقی پاکستانی قانون شامل ہے',
    finalCtaHeading: 'حقوق جاننا',
    finalCtaItalic: 'کوئی استحقاق نہیں۔',
    finalCtaSub:
      'پاکستان کا پہلا خودمختار قانونی اے آئی استعمال کیجیے، آپ کی زبان میں، مکمل پرائیویسی کے ساتھ۔',
    finalCtaButton: 'اسمارٹ کورٹ کھولیں',
    begin: 'شروع',

    // feature cards
    cap01: '01 · سوال و جواب',
    cap02: '02 · معاہدہ',
    cap03: '03 · دستاویزات',
    cap04: '04 · مشق',
    cap00: '00 · آواز',
    cap05: '05 · فرائض',
    capPrivacy: 'بنیادی اصول',
    capOpen: 'اوپن سورس',
    fInquiry: 'مشاورت',
    fInquiryDesc:
      'لکھیے یا بولیے۔ اسمارٹ کورٹ متعلقہ پاکستانی دفعہ تلاش کر کے آپ کی زبان میں جواب دیتی ہے اور لائحہ عمل پیش کرتی ہے۔',
    fScanner: 'اسکینر',
    fScannerDesc:
      'کوئی بھی پی ڈی ایف معاہدہ اپ لوڈ کریں، اسمارٹ کورٹ غیر منصفانہ شقوں کی نشاندہی کر کے متعلقہ قانون بتائے گی۔',
    fDrafter: 'دستاویز ساز',
    fDrafterDesc:
      'ایف آئی آر، قانونی نوٹس، حلف نامہ اور شکایتی خط رسمی انداز میں تیار کر کے ورڈ یا پی ڈی ایف میں ڈاؤن لوڈ کیجیے۔',
    fCourtroom: 'مشقی عدالت',
    fCourtroomDesc:
      'اصلی عدالت میں جانے سے پہلے اے آئی جج کے سامنے اپنا مقدمہ آزمائیں اور تحریری فیصلہ حاصل کریں۔',
    fVoice: 'آواز',
    fVoiceDesc: 'اپنا سوال بولیے۔ آواز مقامی طور پر متن میں بدل کر قانونی جواب دیا جائے گا۔',
    fInheritance: 'وراثت',
    fInheritanceDesc:
      'زندہ ورثاء درج کریں، اسمارٹ کورٹ اسلامی قانون کے مطابق ہر وارث کا درست حصہ، متحرک خاکے اور قرآنی حوالوں کے ساتھ نکالے گی۔',
    fPrivacy: 'مکمل پرائیویسی',
    fPrivacyDesc:
      'آپ کی گفتگو کمپیوٹر سے باہر نہیں جاتی۔ نہ کلاؤڈ، نہ ریکارڈنگ۔ کہیں بھی Ctrl+K دبا کر ایپ کنٹرول کریں۔',

    // chat
    askPlaceholder: 'اپنا قانونی مسئلہ بیان کیجیے',
    send: 'بھیجیں',
    speak: 'بولیں',
    listening: 'سن رہا ہوں',
    thinking: 'اسمارٹ کورٹ سوچ رہی ہے',
    actionPlan: 'لائحہ عمل',
    citations: 'حوالہ جات',
    caseStrength: 'مقدمے کی مضبوطی',
    sources: 'حاصل کردہ ذرائع',
    warning: 'انتباہ',
    welcomeHeading: 'آج میں کس بات میں مدد کر سکتی ہوں؟',
    welcomeDesc:
      'اسمارٹ کورٹ پاکستانی قانون کی متعلقہ دفعہ تلاش کر کے واضح رائے، حوالہ جات اور قدم بہ قدم لائحہ عمل پیش کرے گی۔',
    placeYourMatter: 'اپنا معاملہ پیش کریں',
    inquiryTitle: 'قانونی سوال پوچھیے',
    inquiryDesc:
      'اسمارٹ کورٹ متعلقہ پاکستانی قوانین تلاش کر کے واضح، باحوالہ رائے دے گی اور قدم بہ قدم لائحہ عمل بتائے گی۔',
    composerHint: 'نئی سطر کے لیے Shift + Enter',
    statusReady: 'تیار',
    statusWriting: 'لکھ رہا ہے',
    youLabel: 'آپ',
    aiLabel: 'اسمارٹ کورٹ',
    readingStatutes: 'قانون کی کتابیں دیکھ رہا ہوں',
    follow: 'پیچھے چلیں',
    noCitations: 'ابھی کوئی حوالہ نہیں۔',
    noSources: 'سوال کے بعد یہاں ذرائع ظاہر ہوں گے۔',

    // scanner
    scanDrop: 'پی ڈی ایف معاہدہ یہاں رکھیں',
    scanOr: 'یا کلک کر کے براؤز کریں',
    redFlags: 'خطرناک شقیں',
    recommendations: 'مشورے',
    summary: 'خلاصہ',
    riskScore: 'خطرے کا اسکور',
    scanForRedFlags: 'خطرات کی نشاندہی کریں',
    scanning: 'جانچ جاری ہے',
    scannerTitle: 'غیر منصفانہ شقیں ڈھونڈیں',
    scannerDesc:
      'کوئی بھی پی ڈی ایف معاہدہ اپ لوڈ کریں۔ اسمارٹ کورٹ ہر مشکوک شق پر متعلقہ پاکستانی قانون کے ساتھ روشنی ڈالے گی۔',
    changeFile: 'تبدیل کریں',
    analysingClauses: 'شقوں کی جانچ',
    emptyScanState: 'بائیں طرف معاہدہ اپ لوڈ کریں تاکہ خطرناک شقیں یہاں دکھائی دیں۔',

    // drafter
    drafter: 'دستاویز سازی',
    drafterCta: 'مسودہ بنائیں',
    drafting: 'تحریر ہو رہا ہے',
    downloadPdf: 'پی ڈی ایف ڈاؤن لوڈ',
    downloadDocx: 'ورڈ ڈاؤن لوڈ',
    livePreview: 'فوری جھلک',
    docType: 'دستاویز کی قسم',
    drafterTitle: 'عدالت کے لیے تیار دستاویزات',
    drafterDesc:
      'مختصر فارم بھریں۔ اسمارٹ کورٹ مکمل ایف آئی آر، قانونی نوٹس، حلف نامہ یا شکایتی خط رسمی انداز میں تیار کرے گی۔',
    drafterEmpty: 'فارم بھرنے کے بعد مسودہ بنائیں دبائیں۔',

    // courtroom
    courtroomTitle: 'اے آئی جج کے سامنے مشق',
    courtroomDesc:
      'اصلی عدالت میں جانے سے پہلے اے آئی جج کے سامنے اپنا مقدمہ پیش کریں اور تحریری فیصلہ، مضبوط نکات اور کمزور پہلو حاصل کریں۔',
    courtroomIntro: 'اصلی عدالت سے پہلے اپنا مقدمہ اے آئی جج کے سامنے آزمائیں۔',
    presentCase: 'سماعت شروع کریں',
    requestVerdict: 'فیصلہ طلب کریں',
    verdict: 'فیصلہ',
    strengths: 'مضبوط نکات',
    weaknesses: 'کمزور نکات',
    feedback: 'تبصرہ',
    newCase: 'نیا مقدمہ',
    summariseCase: 'اپنے مقدمے کا خلاصہ دو سے چار جملوں میں لکھیں',

    // history
    historyTitle: 'آپ کی گفتگو',
    historyDesc: 'اسمارٹ کورٹ کے ساتھ ہر مشاورت۔ کھولنے کے لیے کلک کریں۔',
    historyEmpty: 'ابھی کوئی گفتگو نہیں۔',
    historyOpen: 'کھولیں',
    historyDelete: 'حذف کریں',
    minutesAgo: 'منٹ پہلے',
    hoursAgo: 'گھنٹے پہلے',
    daysAgo: 'دن پہلے',
    justNow: 'ابھی',

    // auth
    authSigninTitle: 'خوش آمدید',
    authSigninSub: 'اپنا اسمارٹ کورٹ اکاؤنٹ کھولیے۔',
    authSignupTitle: 'اپنا اکاؤنٹ بنائیں',
    authSignupSub: 'مفت قانونی مشاورت کے لیے مفت اکاؤنٹ۔',
    fullName: 'پورا نام',
    email: 'ای میل',
    password: 'پاس ورڈ',
    submitSignin: 'لاگ اِن',
    submitSignup: 'اکاؤنٹ بنائیں',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    noAccount: 'اکاؤنٹ نہیں ہے؟',
    signinLink: 'لاگ اِن کریں',
    signupLink: 'نیا بنائیں',
    signedInAs: 'لاگ اِن بطور',
    or: 'یا',
    forgotPassword: 'پاس ورڈ بھول گئے؟',

    // categories (legal areas)
    catTenant:   'کرایہ داری',
    catLabour:   'ملازمت',
    catFamily:   'خاندانی',
    catCriminal: 'فوجداری',
    catConsumer: 'صارفین',
    catGeneral:  'عمومی',

    // severities
    sevCritical: 'سنگین',
    sevHigh:     'اعلیٰ',
    sevMedium:   'درمیانہ',
    sevLow:      'کم',

    // chat shell
    caseFile:         'مقدمہ',
    consideredOpinion:'باضابطہ رائے',
    addressPlaceholder:'عدالت سے خطاب کیجیے',
    sessionInProgress:'سماعت جاری',
    sessionEnded:     'سماعت ختم',
    honJustice:       'معزز جج',
    procedure:        'طریقہ کار',
    procStep1:        'حقائق اور فریقین سے ابتدا کیجیے',
    procStep2:        'متعلقہ دفعات کا حوالہ دیجیے',
    procStep3:        'بنچ کے سوالات کا براہ راست جواب دیں',
    procStep4:        'مطلوبہ ریلیف بیان کر کے ختم کریں',
    procStep5:        'تیار ہونے پر فیصلہ طلب کریں',
    aboutCourtroomTip:
      'جج سخت مگر منصفانہ ہے۔ منفی ریمارکس کو اپنا مقدمہ مضبوط کرنے کا موقع سمجھیں۔',
    tryIt:            'آزمائیں',
    suggestedMatters: 'تجویز کردہ معاملات',
    openCourt:        'عدالت کا اجلاس شروع ہے',
    fromCitizen:      'شہری کی طرف سے',
    fileEverythingEnter: 'بھیجنے کے لیے Enter دبائیں۔ نئی سطر کے لیے Shift + Enter۔',
    deliberating:     'غور و فکر',
    consultLater:     'قانونی فیصلے سے پہلے رجسٹرڈ وکیل سے مشورہ کریں۔',

    // inheritance
    navInheritance:  'وراثت',
    wirasatTitle:    'اسلامی وراثت کیلکولیٹر',
    wirasatDesc:     'زندہ ورثاء اور ترکے کی مالیت درج کریں۔ اسمارٹ کورٹ اسلامی قانون اور مسلم عائلی قوانین آرڈیننس کے مطابق ہر وارث کا درست حصہ نکالے گی۔',
    whoSurvives:     'میت کے کون سے ورثاء زندہ ہیں؟',
    spouseLabel:     'زوج / زوجہ',
    spouseNone:      'کوئی نہیں',
    spouseHusband:   'شوہر',
    spouseWife:      'بیوی / بیویاں',
    wivesCount:      'بیویوں کی تعداد',
    sonsLabel:       'بیٹے',
    daughtersLabel:  'بیٹیاں',
    fatherLabel:     'والد حیات',
    motherLabel:     'والدہ حیات',
    brothersLabel:   'سگے بھائی',
    sistersLabel:    'سگی بہنیں',
    estateLabel:     'ترکے کی مالیت (روپے، اختیاری)',
    calculateShares: 'حصے نکالیں',
    sharesResult:    'حصوں کی تقسیم',
    heirCol:         'وارث',
    shareCol:        'حصہ',
    percentCol:      'فیصد',
    amountCol:       'رقم',
    perPerson:       'فی کس',
    awlApplied:      'عول لاگو — حصے متناسب طور پر کم کیے گئے',
    raddApplied:     'رد لاگو — بقیہ ترکہ خونی ورثاء کو واپس',
    wirasatEmpty:    'حساب کے لیے کم از کم ایک زندہ وارث شامل کریں۔',
    wirasatDisclaimer: 'یہ کیلکولیٹر عام صورتوں کا احاطہ کرتا ہے۔ پیچیدہ معاملات (دادا دادی، یتیم پوتے، مخلوط بھائی بہن) کسی عالم یا وکیل سے تصدیق کریں۔',
    basisLabel:      'بنیاد',

    // misc
    free: 'مفت',
    learnMore: 'مزید جانیں',
    openInquiry: 'کھولیں',
  },
}

/** Translate a category key (Tenant, Labour, etc.) into the active language. */
export function categoryName(cat, t) {
  const k = {
    Tenant: 'catTenant',
    Labour: 'catLabour',
    Family: 'catFamily',
    Criminal: 'catCriminal',
    Consumer: 'catConsumer',
    General: 'catGeneral',
  }[cat]
  return k ? t(k) : cat
}

export function severityName(sev, t) {
  const k = {
    critical: 'sevCritical',
    high:     'sevHigh',
    medium:   'sevMedium',
    low:      'sevLow',
  }[sev]
  return k ? t(k) : sev
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('smartcourt:lang') || 'en')
  useEffect(() => {
    localStorage.setItem('smartcourt:lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'
  }, [lang])

  const t = (key) => STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key
  const isUrdu = lang === 'ur'

  return (
    <LanguageCtx.Provider value={{ lang, setLang, t, isUrdu }}>
      {children}
    </LanguageCtx.Provider>
  )
}

export const useLanguage = () => useContext(LanguageCtx)
