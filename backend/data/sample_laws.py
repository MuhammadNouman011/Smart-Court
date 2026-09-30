"""Seed Pakistan law corpus — used when no PDFs have been ingested.

Each entry has: id, category, title, citation, language, text.
This is illustrative content drawn from publicly available Pakistani
statutes and constitutional articles, paraphrased for educational use.
"""
from __future__ import annotations

SAMPLE_LAWS: list[dict] = [
    # --- CONSTITUTION ---
    {
        "id": "const-9",
        "category": "Criminal",
        "title": "Security of Person",
        "citation": "Constitution of Pakistan, Article 9",
        "language": "en",
        "text": (
            "No person shall be deprived of life or liberty save in accordance "
            "with law. This article guarantees the fundamental right to life "
            "and personal liberty for every citizen of Pakistan. Unlawful "
            "detention, custodial torture, and extrajudicial deprivation of "
            "liberty are violations of Article 9 and may be challenged by "
            "writ of habeas corpus under Article 199."
        ),
    },
    {
        "id": "const-10A",
        "category": "Criminal",
        "title": "Right to Fair Trial",
        "citation": "Constitution of Pakistan, Article 10A",
        "language": "en",
        "text": (
            "For the determination of his civil rights and obligations or in "
            "any criminal charge against him a person shall be entitled to a "
            "fair trial and due process. This includes the right to be heard, "
            "to confront witnesses, to legal representation, and to a "
            "reasoned judgment by an impartial tribunal."
        ),
    },
    {
        "id": "const-14",
        "category": "Criminal",
        "title": "Inviolability of Dignity",
        "citation": "Constitution of Pakistan, Article 14",
        "language": "en",
        "text": (
            "The dignity of man and, subject to law, the privacy of home, "
            "shall be inviolable. No person shall be subjected to torture for "
            "the purpose of extracting evidence. This article underpins "
            "constitutional protections against custodial violence and "
            "warrantless intrusion."
        ),
    },
    {
        "id": "const-25",
        "category": "Family",
        "title": "Equality of Citizens",
        "citation": "Constitution of Pakistan, Article 25",
        "language": "en",
        "text": (
            "All citizens are equal before law and are entitled to equal "
            "protection of law. There shall be no discrimination on the basis "
            "of sex. Nothing in this Article shall prevent the State from "
            "making any special provision for the protection of women and "
            "children."
        ),
    },

    # --- PAKISTAN PENAL CODE ---
    {
        "id": "ppc-154-crpc",
        "category": "Criminal",
        "title": "Information in cognizable cases (FIR)",
        "citation": "Code of Criminal Procedure 1898, Section 154",
        "language": "en",
        "text": (
            "Every information relating to the commission of a cognizable "
            "offence, if given orally to an officer in charge of a police "
            "station, shall be reduced to writing by him, read over to the "
            "informant, and signed by the person giving it. The substance "
            "shall be entered in a book kept for the purpose (the FIR "
            "register). The police are bound to register an FIR for any "
            "cognizable offence; refusal can be challenged before the "
            "Justice of Peace under Section 22A."
        ),
    },
    {
        "id": "ppc-354",
        "category": "Criminal",
        "title": "Assault or criminal force to woman with intent to outrage modesty",
        "citation": "Pakistan Penal Code, Section 354",
        "language": "en",
        "text": (
            "Whoever assaults or uses criminal force to any woman, intending "
            "to outrage or knowing it to be likely that he will thereby "
            "outrage her modesty, shall be punished with imprisonment of "
            "either description for a term which may extend to two years, or "
            "with fine, or with both. This is a cognizable, non-bailable "
            "offence triable by Magistrate of the First Class."
        ),
    },
    {
        "id": "ppc-379",
        "category": "Criminal",
        "title": "Punishment for theft",
        "citation": "Pakistan Penal Code, Section 379",
        "language": "en",
        "text": (
            "Whoever commits theft shall be punished with imprisonment of "
            "either description for a term which may extend to three years, "
            "or with fine, or with both. Theft is defined under Section 378 "
            "as dishonestly taking any movable property out of the "
            "possession of any person without that person's consent."
        ),
    },
    {
        "id": "ppc-420",
        "category": "Consumer",
        "title": "Cheating and dishonestly inducing delivery of property",
        "citation": "Pakistan Penal Code, Section 420",
        "language": "en",
        "text": (
            "Whoever cheats and thereby dishonestly induces the person "
            "deceived to deliver any property to any person, or to make, "
            "alter or destroy the whole or any part of a valuable security, "
            "shall be punished with imprisonment of either description for a "
            "term which may extend to seven years, and shall also be liable "
            "to fine."
        ),
    },
    {
        "id": "ppc-506",
        "category": "Criminal",
        "title": "Punishment for criminal intimidation",
        "citation": "Pakistan Penal Code, Section 506",
        "language": "en",
        "text": (
            "Whoever commits the offence of criminal intimidation shall be "
            "punished with imprisonment of either description for a term "
            "which may extend to two years, or with fine, or with both. If "
            "the threat is to cause death or grievous hurt, imprisonment may "
            "extend to seven years."
        ),
    },

    # --- TENANCY ---
    {
        "id": "tenancy-1959-13",
        "category": "Tenant",
        "title": "Grounds for eviction of tenant",
        "citation": "West Pakistan Urban Rent Restriction Ordinance 1959, Section 13",
        "language": "en",
        "text": (
            "A tenant may be evicted only on specified grounds, including "
            "wilful default in payment of rent for the period agreed, sub-"
            "letting without written consent of the landlord, use of premises "
            "for a purpose other than that for which they were let, bona fide "
            "personal need of the landlord, or material damage to the "
            "property. Eviction must be ordered by the Rent Controller; "
            "self-help eviction by the landlord is unlawful."
        ),
    },
    {
        "id": "tenancy-deposit",
        "category": "Tenant",
        "title": "Security deposit and rent receipts",
        "citation": "Sindh Rented Premises Ordinance 1979 / Punjab Rented Premises Act 2009",
        "language": "en",
        "text": (
            "The landlord must issue a written receipt for every payment of "
            "rent and security deposit. Security deposit is refundable on "
            "vacation of the premises after deduction of legitimate dues. "
            "Failure to refund the deposit can be recovered through a suit "
            "for recovery before the Rent Controller."
        ),
    },

    # --- LABOUR ---
    {
        "id": "labour-iro-2012",
        "category": "Labour",
        "title": "Unfair dismissal and right to grievance",
        "citation": "Industrial Relations Act 2012, Section 33; Industrial and Commercial Employment (Standing Orders) Ordinance 1968, Standing Order 10A",
        "language": "en",
        "text": (
            "A workman whose services have been terminated may file a "
            "grievance petition before the Labour Court within 30 days. The "
            "employer must serve a written charge-sheet, conduct a fair "
            "domestic inquiry, and provide the workman an opportunity of "
            "defence before dismissal. Failure renders the termination "
            "illegal and entitles the workman to reinstatement with back "
            "wages."
        ),
    },
    {
        "id": "labour-min-wage",
        "category": "Labour",
        "title": "Minimum wages and overtime",
        "citation": "Minimum Wages Ordinance 1961; Factories Act 1934",
        "language": "en",
        "text": (
            "No worker shall be paid less than the minimum wage notified by "
            "the provincial government. Working hours shall not exceed 9 per "
            "day or 48 per week. Work beyond these limits constitutes "
            "overtime and shall be paid at twice the ordinary rate of wages. "
            "Workers are entitled to one weekly rest day with pay."
        ),
    },
    {
        "id": "labour-eobi",
        "category": "Labour",
        "title": "EOBI registration and old-age benefits",
        "citation": "Employees' Old-Age Benefits Act 1976",
        "language": "en",
        "text": (
            "Every employer of an industrial or commercial establishment "
            "employing five or more workers must register with EOBI within "
            "thirty days. The employer contributes 5% and the worker 1% of "
            "minimum wage as monthly contribution. Insured persons are "
            "entitled to old-age pension, survivor pension, invalidity "
            "pension, and old-age grant."
        ),
    },

    # --- FAMILY ---
    {
        "id": "mfla-1961-7",
        "category": "Family",
        "title": "Talaq (divorce) procedure",
        "citation": "Muslim Family Laws Ordinance 1961, Section 7",
        "language": "en",
        "text": (
            "Any man who wishes to divorce his wife shall, as soon as may be "
            "after the pronouncement of talaq, give the Chairman of the "
            "Union Council notice in writing of his having done so, and "
            "shall supply a copy thereof to the wife. A talaq shall not be "
            "effective until the expiration of ninety days from the day on "
            "which notice is delivered to the Chairman."
        ),
    },
    {
        "id": "mfla-1964-9",
        "category": "Family",
        "title": "Maintenance (Nafaqa) of wife and children",
        "citation": "Muslim Family Laws Ordinance 1961, Section 9; Family Courts Act 1964",
        "language": "en",
        "text": (
            "If a husband fails to maintain his wife adequately, or where "
            "there are more wives than one, fails to maintain them "
            "equitably, the wife may apply to the Chairman who shall "
            "constitute an Arbitration Council. The Family Court has "
            "exclusive jurisdiction over maintenance, dowry, dower, custody "
            "and guardianship of minors."
        ),
    },
    {
        "id": "guardian-1890",
        "category": "Family",
        "title": "Custody of minors (Hizanat)",
        "citation": "Guardians and Wards Act 1890",
        "language": "en",
        "text": (
            "The welfare of the minor is the paramount consideration in all "
            "custody matters. Under Hanafi jurisprudence, custody of a male "
            "child up to age seven and a female child until puberty "
            "ordinarily vests in the mother, subject to her fitness. The "
            "father remains the natural guardian of person and property."
        ),
    },

    # --- CONSUMER ---
    {
        "id": "consumer-2005",
        "category": "Consumer",
        "title": "Defective goods and deficient services",
        "citation": "Punjab Consumer Protection Act 2005, Section 12; ICT Consumer Protection Act 1995",
        "language": "en",
        "text": (
            "A consumer who suffers loss from defective goods or deficient "
            "services may file a claim before the District Consumer Court "
            "within 30 days of the cause of action. Remedies include "
            "replacement of goods, refund of price, compensation, and "
            "punitive damages. Limitation may be extended for sufficient "
            "cause."
        ),
    },
    {
        "id": "consumer-warranty",
        "category": "Consumer",
        "title": "Implied warranty of merchantability",
        "citation": "Sale of Goods Act 1930, Section 16",
        "language": "en",
        "text": (
            "Where goods are bought by description from a seller who deals "
            "in goods of that description, there is an implied condition "
            "that the goods shall be of merchantable quality. If goods do "
            "not conform, the buyer may reject the goods and reclaim the "
            "price, or claim damages for breach of warranty."
        ),
    },

    # --- URDU ENTRIES (mirroring some of the above for Urdu retrieval) ---
    {
        "id": "ppc-154-crpc-ur",
        "category": "Criminal",
        "title": "ایف آئی آر کا اندراج",
        "citation": "ضابطہ فوجداری 1898، دفعہ 154",
        "language": "ur",
        "text": (
            "کسی بھی قابلِ دست اندازی جرم کی اطلاع تھانے کے افسرِ انچارج کو "
            "زبانی دی جائے تو وہ اسے تحریر میں لائے گا، مخبر کو پڑھ کر "
            "سنائے گا اور دستخط لے گا۔ پولیس ہر قابلِ دست اندازی جرم کی ایف آئی "
            "آر درج کرنے کی پابند ہے؛ انکار کی صورت میں دفعہ 22A کے تحت "
            "جسٹس آف پیس سے رجوع کیا جا سکتا ہے۔"
        ),
    },
    {
        "id": "tenancy-1959-13-ur",
        "category": "Tenant",
        "title": "کرایہ دار کی بے دخلی کی بنیادیں",
        "citation": "مغربی پاکستان شہری کرایہ پابندی آرڈیننس 1959، دفعہ 13",
        "language": "ur",
        "text": (
            "کرایہ دار کو صرف مخصوص بنیادوں پر بے دخل کیا جا سکتا ہے، جن میں "
            "کرایہ کی جان بوجھ کر عدم ادائیگی، تحریری اجازت کے بغیر سب لیٹ "
            "کرنا، یا مالک کی حقیقی ذاتی ضرورت شامل ہیں۔ بے دخلی کا حکم "
            "صرف کرایہ کنٹرولر دے سکتا ہے؛ خود کش بے دخلی غیر قانونی ہے۔"
        ),
    },
    {
        "id": "labour-iro-2012-ur",
        "category": "Labour",
        "title": "ناجائز برطرفی اور شکایت کا حق",
        "citation": "صنعتی تعلقات ایکٹ 2012، دفعہ 33",
        "language": "ur",
        "text": (
            "اگر کسی ملازم کو ناجائز طور پر برطرف کیا جائے تو وہ تیس دن کے "
            "اندر لیبر کورٹ میں شکایت دائر کر سکتا ہے۔ آجر کو تحریری "
            "چارج شیٹ، منصفانہ انکوائری اور دفاع کا موقع دینا لازمی ہے، "
            "ورنہ برطرفی غیر قانونی ہوگی اور ملازم بحالی اور بقایا تنخواہ "
            "کا حقدار ہوگا۔"
        ),
    },
    {
        "id": "mfla-1961-7-ur",
        "category": "Family",
        "title": "طلاق کا طریقہ کار",
        "citation": "مسلم عائلی قوانین آرڈیننس 1961، دفعہ 7",
        "language": "ur",
        "text": (
            "طلاق دینے والے شوہر پر لازم ہے کہ وہ یونین کونسل کے چیئرمین کو "
            "تحریری نوٹس دے اور بیوی کو اس کی نقل فراہم کرے۔ طلاق چیئرمین کو "
            "نوٹس ملنے کے دن سے نوے دن کی مدت گزرنے تک مؤثر نہیں ہوگی۔"
        ),
    },
    {
        "id": "consumer-2005-ur",
        "category": "Consumer",
        "title": "ناقص اشیاء اور ناقص خدمات",
        "citation": "پنجاب صارفین کا تحفظ ایکٹ 2005، دفعہ 12",
        "language": "ur",
        "text": (
            "اگر کسی صارف کو ناقص اشیاء یا ناقص خدمات کی وجہ سے نقصان پہنچے "
            "تو وہ سبب پیدا ہونے کے تیس دن کے اندر ضلعی صارفین عدالت میں "
            "دعویٰ دائر کر سکتا ہے۔ سامان کی تبدیلی، رقم کی واپسی، معاوضہ "
            "اور تنبیہی ہرجانہ جیسے علاج دستیاب ہیں۔"
        ),
    },
]
