# RAG Pipeline Test Report

Generated: 2026-08-26 10:30:12

Embedding model: `sentence-transformers/all-MiniLM-L6-v2`  
Vector store: ChromaDB at `./vectorstore`  
Corpus: 24 documents

## Summary

| Metric | Result |
|---|---|
| Category detection | 15/15 (100%) |
| Language detection | 15/15 (100%) |
| Retrieval top-1 | 12/15 (80%) |
| Retrieval hit@5 | 15/15 (100%) |
| Mean retrieval latency | 72 ms |
| Fallback checks | 5/5 |
| Embedding checks | 7/7 |

## Retrieval detail

| Query | Category | Top-1 | Hit@5 | Rank | Top citation |
|---|---|---|---|---|---|
| My employer has not paid my salary for three m… | Labour | yes | yes | 1 | Industrial Relations Act 2012, Section 33; Industrial and Commercial Employment (Standing Orders) Ordinance 1968, Standing Order 10A |
| I was fired without any notice from the factor… | Labour | yes | yes | 1 | Industrial Relations Act 2012, Section 33; Industrial and Commercial Employment (Standing Orders) Ordinance 1968, Standing Order 10A |
| Am I entitled to overtime pay for extra hours? | Labour | yes | yes | 1 | Minimum Wages Ordinance 1961; Factories Act 1934 |
| My landlord is evicting me without proper noti… | Tenant | yes | yes | 1 | West Pakistan Urban Rent Restriction Ordinance 1959, Section 13 |
| The house owner refuses to return my security … | Tenant | yes | yes | 1 | Sindh Rented Premises Ordinance 1979 / Punjab Rented Premises Act 2009 |
| How do I file for khula from my husband? | Family | yes | yes | 1 | Muslim Family Laws Ordinance 1961, Section 7 |
| My husband is not paying maintenance for our c… | Family | yes | yes | 1 | Muslim Family Laws Ordinance 1961, Section 9; Family Courts Act 1964 |
| What are my rights regarding haq mehr after di… | Family | yes | yes | 1 | Muslim Family Laws Ordinance 1961, Section 7 |
| The police are refusing to register my FIR | Criminal | yes | yes | 1 | Code of Criminal Procedure 1898, Section 154 |
| Someone is sending me threatening messages | Criminal | yes | yes | 1 | Pakistan Penal Code, Section 354 |
| I was harassed by my colleague at work | Criminal | no | yes | 2 | Constitution of Pakistan, Article 14 |
| The shop refuses to refund my defective phone | Consumer | yes | yes | 1 | Punjab Consumer Protection Act 2005, Section 12; ICT Consumer Protection Act 1995 |
| I received a fake product from an online order | Consumer | yes | yes | 1 | Sale of Goods Act 1930, Section 16 |
| میرے آجر نے تین ماہ سے تنخواہ نہیں دی | Labour | no | yes | 2 | صنعتی تعلقات ایکٹ 2012، دفعہ 33 |
| مالک مکان مجھے بے دخل کر رہا ہے | Tenant | no | yes | 2 | مغربی پاکستان شہری کرایہ پابندی آرڈیننس 1959، دفعہ 13 |

## Category detection detail

| Query | Expected | Detected | Correct |
|---|---|---|---|
| My employer has not paid my salary for three m… | Labour | Labour | yes |
| I was fired without any notice from the factor… | Labour | Labour | yes |
| Am I entitled to overtime pay for extra hours? | Labour | Labour | yes |
| My landlord is evicting me without proper noti… | Tenant | Tenant | yes |
| The house owner refuses to return my security … | Tenant | Tenant | yes |
| How do I file for khula from my husband? | Family | Family | yes |
| My husband is not paying maintenance for our c… | Family | Family | yes |
| What are my rights regarding haq mehr after di… | Family | Family | yes |
| The police are refusing to register my FIR | Criminal | Criminal | yes |
| Someone is sending me threatening messages | Criminal | Criminal | yes |
| I was harassed by my colleague at work | Criminal | Criminal | yes |
| The shop refuses to refund my defective phone | Consumer | Consumer | yes |
| I received a fake product from an online order | Consumer | Consumer | yes |
| میرے آجر نے تین ماہ سے تنخواہ نہیں دی | Labour | Labour | yes |
| مالک مکان مجھے بے دخل کر رہا ہے | Tenant | Tenant | yes |

## Fallback behaviour

A wrong or unknown category must degrade the answer, never block it.

- [x] Wrong category still returns results — 4 passages
- [x] Unknown category falls back — 5 passages
- [x] General category searches everything — 5 passages
- [x] No category works — 5 passages
- [x] Correct category returns results — 4 passages

## Embedding pipeline

- [x] Embedding produced
- [x] Dimension is 384 — 384
- [x] Vector is normalised — |v| = 1.0000
- [x] Embedding is deterministic
- [x] Paraphrase scores above unrelated text — 0.663 vs 0.191
- [x] Vector store populated — 24 documents
- [x] Every passage carries a citation — 5 checked
