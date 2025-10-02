# SELLY Intelligence Reference Structure Index

**Created**: September 15, 2025  
**Status**: Phase 3 Implementation - Document Migration Complete  
**Version**: 1.0  

## Overview

This document provides a comprehensive index of the SELLY Intelligence reference structure, documenting the migration of enhanced training documents from Phase 2 to the organized reference hierarchy for Phase 3 implementation.

## Directory Structure

```text
/backend/docs/reference/selly-intelligence/
├── persona/                           # Persona definitions and guides
│   ├── persona_dr.md                 # Doctor persona patterns
│   └── selly-persona-guide.md        # Comprehensive persona guidance
├── profile/                           # Service profiles and configurations
│   └── layanan.md                    # Service definitions
├── services/                          # Enhanced service documents
│   ├── civil-registration/           # Birth, death, marriage certificates
│   │   ├── akta-kelahiran.md         # Birth Certificate (Enhanced)
│   │   ├── akta-kematian.md          # Death Certificate (Enhanced)
│   │   └── akta-perkawinan.md        # Marriage Certificate (Enhanced)
│   ├── identity-documents/           # Identity cards and family records
│   │   ├── ktp.md                    # National ID Card (Enhanced)
│   │   ├── kk.md                     # Family Card (Enhanced)
│   │   └── kia.md                    # Children's Identity Card
│   └── general-services/             # Other administrative services
│       ├── perpindahan.md            # Migration/Relocation Services
│       └── pengesahan-pengakuan.md   # Child Recognition Services
└── integration/                       # Framework documentation
    ├── 2025-09-13-selly-documents-training-integration.md
    ├── SELLY-INTEGRATION-STANDARDS.md
    └── [other integration docs]
```

## Document Enhancement Status

### 🎯 Phase 2 Enhanced Documents (6/6 Core Documents)

#### Civil Registration Services

- **✅ akta-kelahiran.md** - Birth Certificate
  - Enhanced with celebratory language and timeline guidance
  - "Sahabat Adminduk" persona integration complete
  - Milestone celebration and supportive FAQ included

- **✅ akta-kematian.md** - Death Certificate  
  - Enhanced with empathy patterns and grief sensitivity
  - Compassionate language and bereavement support
  - Sensitive guidance for difficult circumstances

- **✅ akta-perkawinan.md** - Marriage Certificate
  - Enhanced with celebratory language and interfaith guidance
  - Post-marriage administrative step guidance
  - Comprehensive FAQ with 10 supportive scenarios

#### Identity Documents Services

- **✅ ktp.md** - National ID Card (KTP)
  - Enhanced with myth-busting content and digital alternatives
  - Proactive guidance and troubleshooting support
  - Modern digital service integration

- **✅ kk.md** - Family Card (Kartu Keluarga)
  - Enhanced with family-focused language and celebration scenarios
  - New family member addition guidance
  - Supportive family milestone recognition

- **✅ kia.md** - Children's Identity Card
  - Standard document (migration validation required)

#### General Services

- **📋 perpindahan.md** - Migration/Relocation Services
  - Standard document (enhancement opportunity for Phase 3)

- **📋 pengesahan-pengakuan.md** - Child Recognition Services  
  - Standard document (enhancement opportunity for Phase 3)

## Migration Validation

### RAG System Compatibility

- All migrated documents maintain original file structure
- Document content preserved with enhanced persona patterns
- Training data path references need updating in RAG configuration

### File Integrity Check

```bash
# Verification commands
ls -la /backend/docs/reference/selly-intelligence/services/civil-registration/
ls -la /backend/docs/reference/selly-intelligence/services/identity-documents/
ls -la /backend/docs/reference/selly-intelligence/services/general-services/
```

## Phase 3 Next Steps

### 1. RAG System Configuration Update

- Update document indexing paths to reference new structure
- Validate RAG system recognition of migrated documents
- Test persona response integration with new file locations

### 2. Enhanced Document Validation

- Verify all 6 core enhanced documents are properly integrated
- Test persona pattern detection in new reference structure
- Validate "Sahabat Adminduk" voice consistency

### 3. Additional Document Enhancement

- Enhance remaining general services documents (perpindahan, pengesahan-pengakuan)
- Apply persona patterns to KIA document for completeness
- Create comprehensive service integration documentation

## Integration Framework

The reference structure supports:

- **Modular Organization**: Clear separation by service type
- **Persona Integration**: All enhanced documents maintain "Sahabat Adminduk" voice
- **Scalability**: Easy addition of new services and enhancements
- **RAG Compatibility**: Structure optimized for knowledge retrieval
- **Testing Integration**: Clear paths for validation and quality assurance

## Documentation Standards

- All enhanced documents follow SELLY Integration Standards
- Persona patterns consistently implemented across document types
- Celebratory, empathetic, and supportive language maintained
- FAQ sections provide comprehensive user guidance
- Cultural sensitivity and inclusivity integrated throughout

---

**Migration Complete**: ✅ All Phase 2 enhanced documents successfully migrated to reference structure  
**Next Phase**: RAG system configuration update and additional document enhancement