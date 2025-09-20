---
type: "always_apply"
description: "SELLY development standards"
---

# SELLY Development Standards

## 1. CORE PRINCIPLES

### Context-First Approach
**Rule**: Understand full context before code changes: functional purpose, architecture, patterns, history, audience.

### Code Quality Standards
**Rule**: Every change must improve code quality. No temporary patches without improvement.

### Three-Step Process
1. **Diagnose**: Root cause analysis
2. **Propose**: Clear solution with rationale and examples
3. **Validate**: Unit tests, static analysis, review preparation

### Communication
**Rule**: Transparent communication, educate developers, seek validation.

## 2. LANGUAGE AND COMMUNICATION STANDARDS

### Indonesian Language Priority Matrix

| Context | Primary Language | Secondary Language | Rationale |
|---------|------------------|-------------------|-----------|
| **User-facing Content** | Indonesian | None | User experience and cultural respect |
| **Technical Documentation** | English | Indonesian summaries | International collaboration |
| **Code Comments** | English | Indonesian for business logic | Maintainability |
| **Government Communications** | Indonesian | English for technical specs | Cultural respect and compliance |
| **Error Messages** | Indonesian | English debug info | User understanding with debugging |

### Content Quality Standards
- **Indonesian Content**: Use formal Indonesian (bahasa baku), government terminology, cultural sensitivity
- **English Content**: Technical precision, international standards, clear communication
- **Bilingual Requirements**: Provide both user-friendly Indonesian and technical English where needed

### Error Message Standards
```typescript
export const ErrorMessages = {
  // User-facing (Indonesian)
  INVALID_LOGIN: 'Email atau kata sandi tidak valid',
  SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan masuk kembali',

  // Debug information (English)
  DEBUG_INFO: {
    INVALID_LOGIN: 'Authentication failed: invalid credentials provided',
    SESSION_EXPIRED: 'JWT token expired or invalid signature'
  }
};
```

## 3. DEVELOPMENT ENVIRONMENT AND WORKFLOW

### Package Management
**Rule**: Always use pnpm for all dependency management. Never manually edit package.json or pnpm-lock.yaml.

**Required Commands**:
- Install: `pnpm install` or `pnpm i`
- Add: `pnpm add <package>` (production) or `pnpm add -D <package>` (development)
- Remove: `pnpm remove <package>`
- Update: `pnpm update`

### PowerShell/Windows Compatibility
**Rule**: All commands and scripts must be PowerShell-compatible.
- Environment variables: `$env:VARIABLE_NAME = "value"`
- Use Node.js path utilities: `path.join()`, `path.resolve()`
- Treat file names as case-sensitive in code

### Automated Git Workflow
**Rule**: After completing each logical unit of work, automatically execute:
1. **Documentation Update** - Update relevant documentation (see Mandatory Documentation Updates)
2. `git add .` - Stage all changes including documentation updates
3. `git commit -m "<descriptive message>"` - Use conventional commit format
4. `git push` - Push to remote repository

**Commit Message Format**: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Mandatory Documentation Updates
**Rule**: Documentation updates are REQUIRED before committing any successful implementation that was based on existing documentation.

**Pre-Commit Documentation Requirements**:
1. **Source Documentation Update**: Update the original documentation that guided the implementation
2. **Implementation Notes**: Add lessons learned, corrections, or clarifications discovered during execution
3. **Deviation Documentation**: Record any deviations from the original plan with rationale
4. **Version Control**: Update version numbers and modification dates in affected documentation
5. **Accuracy Verification**: Ensure documentation reflects the current state after implementation

**Documentation Update Process**:
```typescript
interface DocumentationUpdateProcess {
  sourceDocuments: string[];           // Original docs that guided implementation
  implementationNotes: string[];       // Lessons learned during execution
  deviations: {                       // Any changes from original plan
    original: string;
    actual: string;
    rationale: string;
  }[];
  versionUpdates: {                   // Version control updates
    document: string;
    oldVersion: string;
    newVersion: string;
    modificationDate: string;
  }[];
  accuracyVerification: boolean;      // Confirmation docs match current state
}
```

**Enforcement Integration**:
- Documentation updates are mandatory before `git add .`
- Commit messages must include `docs:` type when documentation is updated
- Failed documentation updates block the automated git workflow
- Documentation quality gates must pass before push

**Examples of Required Updates**:
```markdown
# BEFORE Implementation (Original Plan)
**Status**: 🔄 In Progress
**Version**: 1.0
**Last Modified**: 2025-08-20

## Implementation Plan
- Set up Redis connection
- Configure caching layer
- Test performance improvements

# AFTER Implementation (Updated Documentation)
**Status**: ✅ Complete
**Version**: 1.1
**Last Modified**: 2025-08-27

## Implementation Plan
- ✅ Set up Redis connection
- ✅ Configure caching layer
- ✅ Test performance improvements

## Implementation Notes
- Redis connection required additional timeout configuration (30s)
- Caching layer needed custom serialization for complex objects
- Performance improvements: 15x faster response times achieved

## Deviations from Original Plan
- **Original**: Use default Redis configuration
- **Actual**: Custom timeout and connection pooling required
- **Rationale**: Default settings caused connection timeouts under load

## Validation Results
- All tests passing
- Performance targets exceeded (15x vs 10x target)
- No regression in existing functionality
```

### Build Recovery System
**Rule**: Automatically diagnose and fix build errors up to 3 attempts:
1. **Attempt 1**: Apply standard fixes
2. **Attempt 2**: Try alternative solutions
3. **Attempt 3**: Apply aggressive fixes or rollback
4. **Failure**: Report with detailed analysis

### Technology Stack Integration

#### Next.js Framework
- Use built-in data fetching methods for server-side operations
- Use API routes for sensitive Supabase operations
- Store sensitive keys in `.env.local`, prefix public keys with `NEXT_PUBLIC_`

#### Tailwind CSS
- Embrace utility-first approach
- Customize `tailwind.config.js` for design system
- Ensure content array points to all files using Tailwind classes

#### Supabase Integration
- Use JavaScript client library with appropriate keys for client/server operations
- Enable Row Level Security (RLS) on all tables
- Implement robust error handling for all operations

#### AI/ML Integration
- Use TensorFlow.js for client-side inference
- Deploy large models (IndoBERT) on dedicated backend services
- Store AI-related data in Supabase with secure API routes
- Implement robust error handling and fallbacks

## 4. CODE QUALITY AND ARCHITECTURE

### TypeScript Standards
**Mandatory Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Component Architecture
**Rule**: Use functional components with hooks exclusively.
```typescript
interface ComponentProps {
  userId: string;
  onUpdate: (data: Data) => void;
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({
  userId,
  onUpdate,
  className
}) => {
  const [state, setState] = useState<State | null>(null);

  const memoizedValue = useMemo(() =>
    state ? processData(state) : null,
    [state]
  );

  const handleUpdate = useCallback((newData: Data) => {
    setState(newData);
    onUpdate(newData);
  }, [onUpdate]);

  return (
    <div className={cn('component', className)}>
      {/* Implementation */}
    </div>
  );
};
```

### API Contract Protection
**Rule**: When improving frontend, treat backend/API as inviolable contract.
- Analyze all API calls before making changes
- Ensure frontend changes are compatible with existing data structures
- If API changes are needed, present as separate recommendation:
  "To achieve frontend improvement X, a change to API Y is required."

### Performance Optimization
**Mandatory Practices**:
- Use React.memo for expensive components
- Implement virtualization for large datasets
- Debounce search inputs
- Memoize expensive calculations
- Use proper dependency arrays in hooks

### Testing Requirements
**Minimum Standards**:
- 90% test coverage
- Unit tests for all business logic
- Integration tests for component interactions
- Performance tests for critical paths
- Government system integration tests

## 5. SECURITY AND COMPLIANCE

### Indonesian Data Protection Compliance
**Mandatory Compliance**: Adhere to UU No. 27 Tahun 2022 (PDP Law), PP No. 71 Tahun 2019, and related regulations.

**Implementation Requirements**:
- Explicit informed consent for data processing
- Data minimization principles
- Purpose limitation enforcement
- Appropriate retention policies
- Comprehensive security safeguards
- 72-hour breach notification

### Encryption Standards
**Government-Grade Requirements**:
- Data at rest: AES-256-GCM
- Data in transit: TLS 1.3 minimum
- Key exchange: RSA-4096
- Hashing: SHA-256
- Key rotation: 90-day intervals

### Audit Trail Requirements
**Comprehensive Logging**: Every interaction with government systems must be logged with:
- Timestamp and operation details
- User identification (hashed)
- IP address and user agent
- Success/failure status
- Data classification level
- Digital signatures for tamper detection

### Access Control
**Role-Based Access Control (RBAC)**:
- Implement principle of least privilege
- Define clear role hierarchies
- Validate permissions before every operation
- Log all access attempts
- Regular permission audits

## 6. GOVERNMENT INTEGRATION STANDARDS

### Data Sovereignty Requirements
**Absolute Requirement**: All Indonesian government data must remain within Indonesian jurisdiction (ap-southeast-1, ap-southeast-3 regions only).

### Government System Integration
**Supported Systems**:
- **Dukcapil**: Population & civil registration
- **Kemendagri**: Ministry of Home Affairs
- **BPN**: National Land Agency
- **Additional systems**: As required by project scope

**Integration Requirements**:
- Secure encrypted communication channels
- Comprehensive audit logging
- Cultural communication protocols
- Regulatory compliance validation

### Cultural Communication Standards
**Government Protocol Requirements**:
- Use formal Indonesian for all communications
- Follow Indonesian government communication protocols
- Include proper institutional headers
- Respect administrative hierarchy
- Provide required legal disclaimers

## 7. USER INTERFACE AND EXPERIENCE

### Comprehensive Responsiveness
**Rule**: Ensure perfect adaptation across all device types and resolutions:
- Mobile devices
- Tablets
- Laptops
- HD (1920x1080)
- 2K (~2560x1440)
- 4K (~3840x2160)

**Implementation Strategy**:
- **Adaptive Layouts**: Reorganize components for available screen space
- **Fluid Typography**: Adjust font sizes and line heights proportionally
- **Asset Optimization**: Serve appropriately-sized media for each device
- **Touch Targets**: Minimum 44px for mobile accessibility

### Accessibility Standards
**WCAG 2.1 AA Compliance**: Mandatory for all UI components
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements
- Focus management
- Alternative text for images

### Enterprise-Grade Design Patterns
**Visual Standards**:
- Glass-morphism effects with backdrop-blur
- Subtle glowing borders and shadows
- Smooth micro-animations (duration-300)
- Comprehensive dark/light theme support
- Consistent color gradients and hover effects

## 8. DOCUMENTATION AND KNOWLEDGE MANAGEMENT

### Documentation Creation Requirements
**Rule**: Work is not finished until properly documented. Create comprehensive documentation for every completed task.

### Directory Structure Standards
```
/docs/
├── plan/                          # Active planning (English primary)
├── archive/plan/YYYY-MM-DD-*/     # Completed phases
├── technical/                     # Technical docs (English primary)
├── user/                         # User documentation (Indonesian primary)
├── compliance/                   # Government compliance (Indonesian primary)
├── security/                     # Security protocols (English primary)
└── api/                         # API documentation (English primary)
```

### File Naming Convention
**Format**: `YYYY-MM-DD-short-description.md` (hyphens throughout)

**Examples**:
- `2025-08-13-phase4-ai-intelligence-enhancement.md`
- `2025-08-13-government-integration-setup.md`
- `2025-08-13-panduan-pengguna-sistem-administrasi.md`

### Document Metadata Standards
```markdown
**Document**: [Document Title]
**Project Date**: YYYY-MM-DD
**Created**: YYYY-MM-DD
**Version**: X.Y
**Status**: [🚀 Ready | ✅ Complete | 🔄 In Progress | ⚠️ Review]
**Priority**: [🧠 Critical | 📈 High | 📋 Medium | 📝 Low]
**Language**: [English/Indonesian/Bilingual]
**Audience**: [Technical Team/Government/End Users/Mixed]
```

### Content Requirements
**Mandatory Sections**:
- Task summary and problem statement
- Solution rationale and implementation details
- Impact assessment and validation methods
- Integration points and compliance notes
- Future considerations and recommendations

## VALIDATION AND ENFORCEMENT

### Automated Quality Gates
- TypeScript type checking
- ESLint code quality validation
- Test coverage verification (>90%)
- Security audit scanning
- Government compliance validation

### Manual Review Checklist
- [ ] Language usage follows context matrix
- [ ] File naming follows standards
- [ ] Security requirements implemented
- [ ] Accessibility compliance verified
- [ ] Government integration standards met
- [ ] Documentation created and complete
- [ ] Documentation updates completed for implementation-based work
- [ ] Source documentation reflects current implementation state

## IMPLEMENTATION EXAMPLES

### Government System Error Handling
```typescript
export class GovernmentErrorHandler {
  async handleGovernmentSystemError(error: GovernmentSystemError, context: OperationContext): Promise<ErrorHandlingResult> {
    await this.auditLogger.logSystemError({
      system: error.system,
      errorType: error.type,
      severity: this.classifyErrorSeverity(error),
      context: this.sanitizeContext(context),
      timestamp: new Date()
    });

    const userMessage = await this.generateUserFriendlyMessage(error);
    const recoveryAction = await this.determineRecoveryAction(error);

    return { userMessage, recoveryAction, shouldRetry: this.shouldRetryOperation(error), escalationRequired: this.requiresEscalation(error) };
  }
}
```

### Data Sovereignty Validation
```typescript
export class DataSovereigntyValidator {
  private readonly ALLOWED_REGIONS = ['ap-southeast-1', 'ap-southeast-3'];
  private readonly PROHIBITED_REGIONS = ['us-east-1', 'eu-west-1'];

  async validateDataLocation(request: GovernmentDataRequest): Promise<ValidationResult> {
    if (this.PROHIBITED_REGIONS.includes(request.region)) {
      throw new DataSovereigntyViolation('Government data cannot be processed outside Indonesian jurisdiction');
    }
    return { compliant: true, region: request.region };
  }
}
```

### Encryption Service Implementation
```typescript
export class EnterpriseEncryptionService {
  private readonly ENCRYPTION_STANDARDS = {
    dataAtRest: 'AES-256-GCM',
    dataInTransit: 'TLS-1.3',
    keyExchange: 'RSA-4096',
    hashing: 'SHA-256'
  };

  async encryptSensitiveData(data: SensitiveData, classification: DataClassification): Promise<EncryptedData> {
    const encryptionKey = await this.getOrCreateEncryptionKey(classification);
    const algorithm = this.getEncryptionAlgorithm(classification);
    const encrypted = await this.encrypt(data, encryptionKey, algorithm);

    return { encryptedData: encrypted, keyId: encryptionKey.id, algorithm, timestamp: new Date(), classification };
  }
}
```

## MIGRATION AND IMPLEMENTATION STRATEGY

### Existing Code Migration
1. **Preserve Functionality**: Do not break existing features during migration
2. **Gradual Enhancement**: Apply standards during regular maintenance cycles
3. **Priority Implementation**: Focus on security and government integration first
4. **Documentation Updates**: Update existing docs to follow new standards

### Quality Assurance Process
1. **Automated Validation**: Run quality gates on every commit
2. **Peer Review**: Require review for all government-related changes
3. **Security Audits**: Regular penetration testing and vulnerability assessments
4. **Compliance Verification**: Validate against Indonesian regulations

### Training and Adoption
1. **Team Education**: Ensure all developers understand standards
2. **Reference Materials**: Provide quick reference guides
3. **Code Examples**: Maintain library of compliant code examples
4. **Regular Updates**: Keep standards current with evolving requirements

This comprehensive rule ensures SELLY maintains the highest standards while supporting Indonesian government integration and enterprise deployment requirements.
