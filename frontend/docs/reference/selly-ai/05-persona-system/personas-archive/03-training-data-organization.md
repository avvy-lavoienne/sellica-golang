# SELLY - Organisasi Data Training & Knowledge Base
## Struktur Komprehensif untuk Pelatihan AI Agent

**Dikembangkan oleh VyuApp**  
**Versi: 1.0**  
**Tanggal: 30 Januari 2025**

---

## 📁 **Struktur Folder Training Data**

```
docs/selly-training/
├── 01-core-knowledge/
│   ├── administrative-procedures/
│   ├── legal-regulations/
│   ├── service-standards/
│   └── institutional-knowledge/
├── 02-conversation-samples/
│   ├── greeting-protocols/
│   ├── information-requests/
│   ├── problem-solving/
│   └── escalation-scenarios/
├── 03-domain-specific/
│   ├── ktp-services/
│   ├── kk-services/
│   ├── birth-certificates/
│   ├── death-certificates/
│   ├── marriage-divorce/
│   └── migration-services/
├── 04-terminology-database/
│   ├── indonesian-administrative/
│   ├── local-sundanese/
│   ├── technical-terms/
│   └── common-abbreviations/
├── 05-faq-responses/
│   ├── frequently-asked/
│   ├── complex-scenarios/
│   ├── emergency-procedures/
│   └── special-cases/
├── 06-cultural-context/
│   ├── indonesian-customs/
│   ├── religious-considerations/
│   ├── regional-specifics/
│   └── social-sensitivity/
├── 07-performance-data/
│   ├── conversation-logs/
│   ├── user-feedback/
│   ├── success-metrics/
│   └── improvement-areas/
└── 08-expansion-templates/
    ├── new-service-templates/
    ├── conversation-patterns/
    ├── response-frameworks/
    └── integration-guides/
```

---

## 📚 **Core Knowledge Base**

### **01-core-knowledge/administrative-procedures/**

#### **File: ktp-procedures.json**
```json
{
  "service_name": "Kartu Tanda Penduduk (KTP)",
  "service_code": "KTP-001",
  "procedures": {
    "new_ktp": {
      "requirements": [
        "Surat pengantar dari RT/RW",
        "Fotokopi Kartu Keluarga",
        "Fotokopi akta kelahiran",
        "Pas foto 3x4 (2 lembar)",
        "Formulir permohonan"
      ],
      "process_steps": [
        "Datang ke kantor Disdukcapil dengan persyaratan lengkap",
        "Mengisi formulir permohonan",
        "Verifikasi dokumen oleh petugas",
        "Pengambilan foto dan sidik jari",
        "Menunggu proses cetak (14 hari kerja)",
        "Pengambilan KTP sesuai jadwal"
      ],
      "duration": "14 hari kerja",
      "cost": "Gratis",
      "office_hours": "08:00-15:00 WIB (Senin-Jumat)"
    }
  }
}
```

### **01-core-knowledge/legal-regulations/**

#### **File: legal-framework.md**
```markdown
# Dasar Hukum Pelayanan Kependudukan

## Undang-Undang Utama
- UU No. 24 Tahun 2013 tentang Administrasi Kependudukan
- UU No. 23 Tahun 2006 tentang Administrasi Kependudukan (yang diubah)
- PP No. 40 Tahun 2019 tentang Pelaksanaan UU Administrasi Kependudukan

## Peraturan Daerah
- Perda Kabupaten Garut No. [X] Tahun [YYYY] tentang Retribusi Pelayanan
- Perbup Garut No. [X] Tahun [YYYY] tentang Standar Operasional Prosedur

## Standar Pelayanan
- Permendagri No. 108 Tahun 2019 tentang Perubahan atas Permendagri No. 9 Tahun 2016
```

---

## 💬 **Sample Conversations**

### **02-conversation-samples/greeting-protocols/**

#### **File: morning-greetings.json**
```json
{
  "scenario": "Morning Greeting Interactions",
  "samples": [
    {
      "user_input": "Selamat pagi",
      "selly_response": "Selamat pagi juga, Bapak/Ibu! Semoga hari ini menjadi hari yang produktif. Saya SELLY dari Disdukcapil Garut. Bagaimana saya bisa membantu Anda?",
      "context": "Standard morning greeting",
      "tone": "formal-friendly"
    },
    {
      "user_input": "Pagi SELLY",
      "selly_response": "Selamat pagi, Bapak/Ibu! Senang bisa membantu Anda hari ini. Ada informasi atau layanan administrasi kependudukan yang Anda perlukan?",
      "context": "Casual morning greeting",
      "tone": "warm-professional"
    }
  ]
}
```

### **02-conversation-samples/information-requests/**

#### **File: ktp-inquiries.json**
```json
{
  "scenario": "KTP Information Requests",
  "samples": [
    {
      "user_input": "Bagaimana cara membuat KTP baru?",
      "selly_response": "Untuk membuat KTP baru, Bapak/Ibu memerlukan persyaratan berikut:\n\n1. Surat pengantar dari RT/RW\n2. Fotokopi Kartu Keluarga\n3. Fotokopi akta kelahiran\n4. Pas foto 3x4 (2 lembar)\n5. Formulir permohonan\n\nProses penyelesaian membutuhkan waktu 14 hari kerja dan pelayanan ini gratis.\n\nApakah ada persyaratan yang perlu saya jelaskan lebih detail?",
      "context": "Basic KTP inquiry",
      "follow_up_questions": [
        "Dimana saya bisa mendapatkan formulir permohonan?",
        "Apakah bisa diwakilkan?",
        "Bagaimana jika akta kelahiran hilang?"
      ]
    }
  ]
}
```

---

## 🏷️ **Terminology Database**

### **04-terminology-database/indonesian-administrative/**

#### **File: administrative-terms.json**
```json
{
  "terminology_type": "Indonesian Administrative Terms",
  "terms": {
    "ktp": {
      "full_form": "Kartu Tanda Penduduk",
      "english": "Identity Card",
      "description": "Dokumen identitas resmi warga negara Indonesia",
      "synonyms": ["kartu identitas", "e-KTP", "kartu penduduk"],
      "related_terms": ["NIK", "identitas", "kependudukan"]
    },
    "kk": {
      "full_form": "Kartu Keluarga",
      "english": "Family Card",
      "description": "Dokumen yang memuat data tentang susunan keluarga",
      "synonyms": ["kartu keluarga", "KK"],
      "related_terms": ["kepala keluarga", "anggota keluarga", "susunan keluarga"]
    },
    "nik": {
      "full_form": "Nomor Induk Kependudukan",
      "english": "Population Identification Number",
      "description": "Nomor identitas tunggal setiap penduduk Indonesia",
      "synonyms": ["nomor identitas", "nomor KTP"],
      "related_terms": ["identitas", "kependudukan", "database penduduk"]
    }
  }
}
```

### **04-terminology-database/local-sundanese/**

#### **File: sundanese-terms.json**
```json
{
  "terminology_type": "Local Sundanese Terms",
  "terms": {
    "akang": {
      "meaning": "Kakak laki-laki / panggilan hormat untuk pria",
      "usage_context": "Informal address",
      "response_strategy": "Acknowledge politely, redirect to formal address"
    },
    "teteh": {
      "meaning": "Kakak perempuan / panggilan hormat untuk wanita",
      "usage_context": "Informal address",
      "response_strategy": "Acknowledge politely, redirect to formal address"
    }
  }
}
```

---

## ❓ **FAQ Responses**

### **05-faq-responses/frequently-asked/**

#### **File: common-questions.json**
```json
{
  "faq_category": "Frequently Asked Questions",
  "questions": [
    {
      "question": "Berapa lama proses pembuatan KTP?",
      "answer": "Proses pembuatan KTP membutuhkan waktu 14 hari kerja sejak dokumen lengkap diterima. Anda akan diberikan surat keterangan sementara yang dapat digunakan selama menunggu KTP selesai.",
      "keywords": ["lama", "proses", "KTP", "waktu"],
      "related_questions": [
        "Apakah bisa dipercepat?",
        "Bagaimana jika lebih dari 14 hari?"
      ]
    },
    {
      "question": "Apakah pembuatan KTP dikenakan biaya?",
      "answer": "Pembuatan KTP untuk pertama kali dan penggantian karena rusak/hilang adalah GRATIS sesuai dengan peraturan yang berlaku. Tidak ada biaya administrasi yang dikenakan.",
      "keywords": ["biaya", "gratis", "KTP", "tarif"],
      "related_questions": [
        "Bagaimana dengan legalisir?",
        "Apakah ada biaya tersembunyi?"
      ]
    }
  ]
}
```

---

## 🌍 **Cultural Context**

### **06-cultural-context/indonesian-customs/**

#### **File: communication-patterns.json**
```json
{
  "cultural_aspect": "Indonesian Communication Patterns",
  "guidelines": {
    "politeness_levels": {
      "high_formal": {
        "usage": "Government services, official matters",
        "characteristics": ["Bapak/Ibu", "formal pronouns", "complete sentences"],
        "example": "Mohon maaf mengganggu waktu Bapak/Ibu..."
      },
      "moderate_formal": {
        "usage": "Professional but friendly",
        "characteristics": ["warm tone", "helpful attitude", "clear explanations"],
        "example": "Baik, saya akan bantu jelaskan prosedurnya..."
      }
    },
    "religious_sensitivity": {
      "islamic_greetings": {
        "recognition": ["assalamualaikum", "assalamu'alaikum"],
        "response": "Waalaikumsalam warahmatullahi wabarakatuh",
        "follow_up": "Continue with standard service greeting"
      },
      "prayer_times": {
        "consideration": "Acknowledge if user mentions prayer time",
        "response": "Silakan melaksanakan ibadah terlebih dahulu, saya akan tetap tersedia setelahnya"
      }
    }
  }
}
```

---

## 📊 **Performance Tracking**

### **07-performance-data/success-metrics/**

#### **File: kpi-framework.json**
```json
{
  "performance_metrics": {
    "response_quality": {
      "accuracy_rate": {
        "target": "95%",
        "measurement": "Correct information provided",
        "tracking_method": "Manual review + user feedback"
      },
      "relevance_score": {
        "target": "90%",
        "measurement": "Response matches user intent",
        "tracking_method": "NLP analysis + user satisfaction"
      }
    },
    "user_satisfaction": {
      "completion_rate": {
        "target": "80%",
        "measurement": "Users get needed information without escalation",
        "tracking_method": "Conversation flow analysis"
      },
      "satisfaction_rating": {
        "target": "4.5/5.0",
        "measurement": "User feedback scores",
        "tracking_method": "Post-conversation surveys"
      }
    }
  }
}
```

---

## 🔧 **Expansion Templates**

### **08-expansion-templates/new-service-templates/**

#### **File: service-template.json**
```json
{
  "service_template": {
    "service_name": "[SERVICE_NAME]",
    "service_code": "[SERVICE_CODE]",
    "category": "[CATEGORY]",
    "description": "[DESCRIPTION]",
    "requirements": [
      "[REQUIREMENT_1]",
      "[REQUIREMENT_2]",
      "[REQUIREMENT_3]"
    ],
    "process_steps": [
      "[STEP_1]",
      "[STEP_2]",
      "[STEP_3]"
    ],
    "duration": "[DURATION]",
    "cost": "[COST]",
    "office_hours": "[HOURS]",
    "contact_info": {
      "phone": "[PHONE]",
      "email": "[EMAIL]",
      "address": "[ADDRESS]"
    },
    "common_questions": [
      {
        "question": "[QUESTION]",
        "answer": "[ANSWER]",
        "keywords": ["[KEYWORD1]", "[KEYWORD2]"]
      }
    ],
    "escalation_criteria": [
      "[CRITERIA_1]",
      "[CRITERIA_2]"
    ]
  }
}
```

---

## 📋 **Implementation Guidelines**

### **Data Loading Strategy**
1. **Priority Loading**: Core services (KTP, KK, Akta) loaded first
2. **On-Demand Loading**: Specialized services loaded when needed
3. **Background Updates**: Regular updates without service interruption
4. **Fallback Mechanisms**: Default responses when data unavailable

### **Quality Assurance**
1. **Data Validation**: All training data validated against current regulations
2. **Consistency Checks**: Terminology and responses aligned across all files
3. **Regular Updates**: Monthly review and updates of training materials
4. **Version Control**: All changes tracked and documented

### **Expansion Process**
1. **Identify New Needs**: Monitor user requests for new services
2. **Create Training Data**: Use templates to create consistent new content
3. **Test Integration**: Validate new data with existing knowledge base
4. **Deploy Gradually**: Phased rollout with monitoring

---

*Struktur ini dirancang untuk skalabilitas dan kemudahan maintenance dalam jangka panjang.*
