# SELLY Pengajuan Query Examples - Reference Guide

**Date**: January 28, 2025  
**Purpose**: Quick reference for "pengajuan" query behavior patterns  
**Status**: 🚨 **CRITICAL ROUTING INCONSISTENCY**  
**Related**: `2025-01-28_pengajuan-mismatching-trouble-analysis.md`

---

## 📋 **Real Query Examples from User Testing**

### **✅ WORKING QUERY - Perfect Database Response**

#### **Query:**
```
"Siapa saja yang mengajukan adjudicate record bulan ini"
```

#### **Response (SUCCESS):**
```
Berikut adalah informasi tentang Adjudicate Record untuk bulan ini. Periode pencarian yang kami gunakan untuk mengumpulkan data ini adalah dari 1 Juli 2025 pukul 00.00 hingga 31 Juli 2025 pukul 23.59, yang totalnya adalah 31 hari. 

Dalam periode ini, ada satu orang pengguna yang mengajukan permohonan, dengan total satu pengajuan. Pengguna tersebut diidentifikasi dengan kode unik c395d8af-410d-4821-91f4-1fd8ec39b0e4. Jika Anda membutuhkan informasi lebih lanjut atau detail tentang pengajuan ini, silakan bertanya.
```

#### **Analysis:**
- ✅ **Tool Used**: Temporal Intelligence Tool
- ✅ **Database Query**: Executed successfully
- ✅ **Table**: `adjudicate_record` (correct)
- ✅ **Response Quality**: Enterprise-grade with:
  - Specific date range (Juli 2025)
  - Exact data (1 user, UUID provided)
  - Business context and professional formatting
  - Actionable follow-up suggestions

---

### **❌ BROKEN QUERY 1 - IndoBERT Fallback**

#### **Query:**
```
"Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai"
```

#### **Response (FAILURE):**
```
Teks Anda telah diproses menggunakan model IndoBERT, yang menunjukkan bahwa analisis semantik telah berhasil memahami konteks bahasa Indonesia dengan baik. Proses ini menggunakan model khusus yang disebut indobert-ner untuk memastikan pemahaman yang akurat terhadap bahasa Indonesia.
```

#### **Analysis:**
- ❌ **Tool Used**: IndoBERT (wrong - should use database tools)
- ❌ **Database Query**: None executed
- ❌ **Table**: None accessed
- ❌ **Response Quality**: Generic text processing response:
  - No actual data retrieval
  - No NIK-specific information
  - No status information
  - Generic language processing explanation

---

### **❌ BROKEN QUERY 2 - Same IndoBERT Fallback**

#### **Query:**
```
"Apakah adjudicate record NIK 3273052309950003 telah selesai"
```

#### **Response (FAILURE):**
```
Setelah saya melakukan analisis, teks Anda telah diproses menggunakan model IndoBERT. Ini menunjukkan bahwa ada pemahaman yang baik terhadap konteks bahasa Indonesia. Saya menggunakan model indobert-ner untuk menganalisis teks tersebut, sehingga hasilnya dapat memberikan gambaran yang lebih akurat tentang pemahaman bahasa.
```

#### **Analysis:**
- ❌ **Tool Used**: IndoBERT (wrong - should use database tools)
- ❌ **Database Query**: None executed
- ❌ **Table**: None accessed
- ❌ **Response Quality**: Generic text processing response:
  - No NIK lookup performed
  - No status checking
  - No business context
  - Same generic IndoBERT explanation

---

## 🔍 **Pattern Analysis**

### **Why Query 1 Works:**
```
"Siapa saja yang mengajukan adjudicate record bulan ini"
```

**Success Factors:**
1. **Temporal Keywords**: "bulan ini" triggers temporal intelligence
2. **User Aggregation**: "siapa saja" indicates user listing query
3. **Table Context**: "adjudicate record" clearly identifies target table
4. **Query Type**: Aggregation query with temporal context

**Tool Selection Path:**
```
Query → Temporal Pattern Detection → Temporal Intelligence Tool → Database Query → Success
```

### **Why Queries 2 & 3 Fail:**
```
"Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai"
"Apakah adjudicate record NIK 3273052309950003 telah selesai"
```

**Failure Factors:**
1. **Missing Pattern**: "Apakah [...] telah selesai" not recognized
2. **NIK + Status Combination**: No specific handler for NIK status queries
3. **Status Inquiry**: "telah selesai" pattern not in tool selection
4. **Individual Record**: Should use individual record tool, not temporal

**Tool Selection Path:**
```
Query → No Pattern Match → Fallback to IndoBERT → Generic Response → Failure
```

---

## 🎯 **Critical Missing Patterns**

### **Status Inquiry Patterns (Not Recognized):**
- `"Apakah [...] telah selesai"`
- `"Apakah [...] sudah selesai"`
- `"Status [...] gimana"`
- `"[...] sudah selesai belum"`

### **NIK + Status Combinations (Not Recognized):**
- `"pengajuan [...] NIK [...] telah selesai"`
- `"adjudicate record NIK [...] telah selesai"`
- `"NIK [...] sudah selesai"`
- `"status pengajuan NIK [...]"`

### **Individual Record Queries (Not Recognized):**
- `"Apakah pengajuan [...] telah selesai"`
- `"Bagaimana status pengajuan [...]"`
- `"Gimana progress [...] NIK [...]"`

---

## 🛠️ **Expected Behavior After Fix**

### **Query 2 Should Respond:**
```
Query: "Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai"

Expected Response:
✅ **Status Pengajuan Adjudicate Record**

**NIK**: 3273052309950003
**Status**: Selesai
**Tanggal Pengajuan**: 15 Juli 2025
**Terakhir Update**: 20 Juli 2025

🎉 **Pengajuan telah selesai diproses!**

**Keterangan**: Dokumen telah diterbitkan dan siap diambil.
**Langkah Selanjutnya**: Silakan datang ke kantor untuk mengambil dokumen dengan membawa KTP asli.
```

### **Query 3 Should Respond:**
```
Query: "Apakah adjudicate record NIK 3273052309950003 telah selesai"

Expected Response:
✅ **Status Adjudicate Record**

**NIK**: 3273052309950003
**Status**: Selesai
**ID Record**: c395d8af-410d-4821-91f4-1fd8ec39b0e4
**Tanggal Pengajuan**: 15 Juli 2025
**Terakhir Update**: 20 Juli 2025

🎉 **Record telah selesai diproses!**

**Detail**: Semua tahap validasi telah selesai dan dokumen siap diterbitkan.
```

---

## 📊 **Impact Summary**

### **Current State:**
- **Working Queries**: 1/3 (33% success rate)
- **Database Tool Usage**: 33% for "pengajuan" queries
- **User Experience**: Highly inconsistent and confusing
- **Business Value**: Limited - no real-time status tracking

### **Target State (After Fix):**
- **Working Queries**: 3/3 (100% success rate)
- **Database Tool Usage**: 100% for all "pengajuan" queries
- **User Experience**: Consistent, professional, data-driven
- **Business Value**: Complete real-time status tracking and analytics

---

## 🚀 **Implementation Priority**

### **Immediate Fix Required:**
1. **Add NIK + Status pattern detection** to tool selection
2. **Implement status inquiry patterns** in individual record analysis
3. **Create status-specific response templates** with business context
4. **Test with exact query examples** provided above

### **Success Criteria:**
- All 3 example queries should use database tools (not IndoBERT)
- Responses should include actual NIK data and status information
- Professional formatting with business context and next steps
- Sub-2 second response time for all queries

---

**Reference**: This document provides real examples for testing the fix described in `2025-01-28_pengajuan-mismatching-trouble-analysis.md`

**Test Command**: Use these exact queries to validate the implementation:
```bash
# Test queries (should all use database tools after fix)
"Siapa saja yang mengajukan adjudicate record bulan ini"           # ✅ Already working
"Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai"  # ❌ Needs fix
"Apakah adjudicate record NIK 3273052309950003 telah selesai"           # ❌ Needs fix
```
