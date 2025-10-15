# Flowbite Pro Frontend Refining Guide - Form Components

**Document**: Flowbite Pro UI/UX Refining Guide - Form Components
**Project Date**: 2025-10-15
**Created**: 2025-10-15
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation

## Executive Summary

This guide provides detailed instructions for refining SELLY form components using Flowbite Pro materials. Forms are critical user interaction points, especially for SILPANA complaint submissions and administrative functions. The guide ensures consistent validation, accessibility, and user experience across all form implementations.

## Current Form Analysis

### Existing Form Components

**Location**: `frontend/src/components/`, various form implementations

**Current Issues**:
- Inconsistent input styling and validation
- Manual form state management
- Limited accessibility features
- Custom validation without proper error display
- No standardized form layouts

**Common Patterns Found**:
```typescript
// Current pattern - inconsistent validation
<input
  className="border rounded px-3 py-2"
  onChange={(e) => setValue(e.target.value)}
/>

// Manual error display
{error && <span className="text-red-500 text-sm">{error}</span>}
```

## Flowbite Pro Form Patterns

### Template Form Components

**Location**: `templates/flowbite-pro-nextjs-admin-dashboard-1.2.2/`

**Key Features**:
- Consistent form styling with Flowbite React
- Built-in validation and error states
- Accessible form controls
- Theme-aware design
- Proper focus management

### Core Form Components

**Text Input with Validation**:
```typescript
import { TextInput, Label } from "flowbite-react";

function ValidatedInput({ label, error, ...props }) {
  return (
    <div>
      <Label htmlFor={props.id} value={label} />
      <TextInput
        {...props}
        color={error ? "failure" : "gray"}
        helperText={error}
      />
    </div>
  );
}
```

## Form Component Refinement

### Input Field Components

**Standardized Text Input**:
```typescript
interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  icon?: React.ComponentType<any>;
}

export function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
  helperText,
  icon
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        value={`${label}${required ? ' *' : ''}`}
        className="text-sm font-medium text-gray-900 dark:text-white"
      />
      <TextInput
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        color={error ? 'failure' : 'gray'}
        disabled={disabled}
        icon={icon}
        required={required}
        className="w-full"
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
```

**Textarea Component**:
```typescript
interface FormTextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

export function FormTextarea({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
  rows = 4,
  maxLength
}: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        value={`${label}${required ? ' *' : ''}`}
        className="text-sm font-medium text-gray-900 dark:text-white"
      />
      <Textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        color={error ? 'failure' : 'gray'}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className="w-full"
      />
      {maxLength && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {value.length}/{maxLength}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Selection Components

**Select Dropdown**:
```typescript
interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  disabled,
  placeholder
}: FormSelectProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        value={`${label}${required ? ' *' : ''}`}
        className="text-sm font-medium text-gray-900 dark:text-white"
      />
      <Select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        color={error ? 'failure' : 'gray'}
        disabled={disabled}
        className="w-full"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </Select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
```

**Checkbox Group**:
```typescript
interface FormCheckboxGroupProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; checked: boolean }>;
  onChange: (value: string, checked: boolean) => void;
  error?: string;
  required?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

export function FormCheckboxGroup({
  label,
  name,
  options,
  onChange,
  error,
  required,
  orientation = 'vertical'
}: FormCheckboxGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-900 dark:text-white">
        {`${label}${required ? ' *' : ''}`}
      </legend>
      <div className={twMerge(
        'space-y-2',
        orientation === 'horizontal' && 'flex flex-wrap gap-4'
      )}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <Checkbox
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={option.checked}
              onChange={(e) => onChange(option.value, e.target.checked)}
            />
            <Label
              htmlFor={`${name}-${option.value}`}
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  );
}
```

### File Upload Components

**File Upload with Preview**:
```typescript
interface FormFileUploadProps {
  label: string;
  name: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onChange: (files: FileList | null) => void;
  error?: string;
  required?: boolean;
  preview?: boolean;
}

export function FormFileUpload({
  label,
  name,
  accept,
  multiple,
  maxSize = 10,
  onChange,
  error,
  required,
  preview = false
}: FormFileUploadProps) {
  const [files, setFiles] = useState<FileList | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && maxSize) {
      const oversized = Array.from(selectedFiles).some(
        file => file.size > maxSize * 1024 * 1024
      );
      if (oversized) {
        // Handle error
        return;
      }
    }
    setFiles(selectedFiles);
    onChange(selectedFiles);
  };

  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        value={`${label}${required ? ' *' : ''}`}
        className="text-sm font-medium text-gray-900 dark:text-white"
      />
      <FileInput
        id={name}
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        color={error ? 'failure' : 'gray'}
        className="w-full"
      />
      {maxSize && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ukuran maksimal: {maxSize}MB per file
        </p>
      )}
      {preview && files && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Array.from(files).map((file, index) => (
            <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
              {file.name}
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
```

## Form Layout Components

### Form Container

**Standardized Form Layout**:
```typescript
interface FormContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function FormContainer({
  children,
  title,
  subtitle,
  onSubmit,
  submitLabel = 'Simpan',
  isSubmitting = false,
  className
}: FormContainerProps) {
  return (
    <ContentCard className={className}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {children}

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Menyimpan...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </ContentCard>
  );
}
```

### Form Section

**Grouped Form Fields**:
```typescript
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className
}: FormSectionProps) {
  return (
    <div className={twMerge('space-y-4', className)}>
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}
```

## Validation System

### Form Validation Hook

**Custom Validation Hook**:
```typescript
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface FieldConfig {
  [key: string]: ValidationRule;
}

export function useFormValidation<T extends Record<string, any>>(
  config: FieldConfig
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback((name: keyof T, value: string) => {
    const rules = config[name as string];
    if (!rules) return null;

    if (rules.required && !value.trim()) {
      return 'Field ini wajib diisi';
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `Minimal ${rules.minLength} karakter`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maksimal ${rules.maxLength} karakter`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Format tidak valid';
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [config]);

  const validateForm = useCallback((data: T) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(config).forEach((key) => {
      const error = validateField(key as keyof T, data[key]);
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [config, validateField]);

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const getFieldError = useCallback((name: keyof T) => {
    return touched[name] ? errors[name] : null;
  }, [touched, errors]);

  return {
    errors,
    validateField,
    validateForm,
    setFieldTouched,
    getFieldError,
    isValid: Object.keys(errors).length === 0
  };
}
```

## SILPANA-Specific Forms

### Complaint Submission Form

**SILPANA Form Structure**:
```typescript
const silpanaValidationConfig: FieldConfig = {
  complainantName: { required: true, minLength: 2, maxLength: 100 },
  complainantEmail: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  complaintType: { required: true },
  complaintTitle: { required: true, minLength: 10, maxLength: 200 },
  complaintDescription: { required: true, minLength: 50, maxLength: 2000 },
  location: { required: true },
  attachments: {
    custom: (value) => {
      if (!value) return null;
      const files = JSON.parse(value);
      if (files.length > 5) return 'Maksimal 5 file';
      return null;
    }
  }
};

export function SilpanaComplaintForm() {
  const [formData, setFormData] = useState({
    complainantName: '',
    complainantEmail: '',
    complaintType: '',
    complaintTitle: '',
    complaintDescription: '',
    location: '',
    attachments: null as FileList | null
  });

  const validation = useFormValidation(silpanaValidationConfig);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.validateForm(formData)) {
      // Mark all fields as touched to show errors
      Object.keys(formData).forEach(key => {
        validation.setFieldTouched(key as keyof typeof formData);
      });
      return;
    }

    // Submit to Supabase
    // ... submission logic
  };

  return (
    <FormContainer
      title="Pengaduan SILPANA"
      subtitle="Laporkan keluhan atau masalah Anda"
      onSubmit={handleSubmit}
      submitLabel="Kirim Pengaduan"
    >
      <FormSection title="Informasi Pengadu">
        <FormInput
          label="Nama Lengkap"
          name="complainantName"
          value={formData.complainantName}
          onChange={(value) => setFormData(prev => ({ ...prev, complainantName: value }))}
          error={validation.getFieldError('complainantName')}
          required
        />

        <FormInput
          label="Email"
          name="complainantEmail"
          type="email"
          value={formData.complainantEmail}
          onChange={(value) => setFormData(prev => ({ ...prev, complainantEmail: value }))}
          error={validation.getFieldError('complainantEmail')}
          required
        />
      </FormSection>

      <FormSection title="Detail Pengaduan">
        <FormSelect
          label="Jenis Pengaduan"
          name="complaintType"
          value={formData.complaintType}
          onChange={(value) => setFormData(prev => ({ ...prev, complaintType: value }))}
          options={complaintTypes}
          error={validation.getFieldError('complaintType')}
          required
        />

        <FormInput
          label="Judul Pengaduan"
          name="complaintTitle"
          value={formData.complaintTitle}
          onChange={(value) => setFormData(prev => ({ ...prev, complaintTitle: value }))}
          error={validation.getFieldError('complaintTitle')}
          required
        />
      </FormSection>

      <FormSection>
        <div className="md:col-span-2">
          <FormTextarea
            label="Deskripsi Pengaduan"
            name="complaintDescription"
            value={formData.complaintDescription}
            onChange={(value) => setFormData(prev => ({ ...prev, complaintDescription: value }))}
            error={validation.getFieldError('complaintDescription')}
            rows={6}
            maxLength={2000}
            required
          />
        </div>
      </FormSection>

      <FormSection title="Lampiran (Opsional)">
        <div className="md:col-span-2">
          <FormFileUpload
            label="Upload File Pendukung"
            name="attachments"
            accept="image/*,.pdf,.doc,.docx"
            multiple
            maxSize={5}
            onChange={(files) => setFormData(prev => ({ ...prev, attachments: files }))}
            error={validation.getFieldError('attachments')}
            preview
          />
        </div>
      </FormSection>
    </FormContainer>
  );
}
```

## Testing Form Components

### Form Testing Checklist

**Functionality Testing**:
- [ ] All required fields validated
- [ ] Error messages display correctly
- [ ] Form submission works
- [ ] File uploads function properly
- [ ] Validation prevents invalid submissions

**Accessibility Testing**:
- [ ] Labels associated with inputs
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Error messages announced
- [ ] Focus management proper

**Responsive Testing**:
- [ ] Form layout adapts to screen sizes
- [ ] Touch targets appropriate size
- [ ] Input methods work on mobile

## Implementation Steps

### Phase 1: Core Form Components

1. Create standardized input components
2. Implement validation system
3. Set up form layouts

### Phase 2: SILPANA Form Migration

1. Refactor complaint submission form
2. Update validation rules
3. Test end-to-end submission flow

### Phase 3: Admin Form Updates

1. Update user management forms
2. Standardize settings forms
3. Apply consistent styling

### Phase 4: Testing & Polish

1. Comprehensive testing
2. Performance optimization
3. Accessibility audit

## References

- [Flowbite Form Components](https://flowbite-react.com/docs/components/forms)
- [React Hook Form](https://react-hook-form.com/)
- [WCAG Form Guidelines](https://www.w3.org/WAI/WCAG21/quickref/#input-purposes)
- [SILPANA Form Requirements](../../docs/SILPANA-ARCHITECTURE-ANALYSIS.md)</content>
<parameter name="filePath">C:\Users\MyPC PRO\Documents\Firman\Project\sellica-golang\docs\bydate\2025-10-15\flowbite-pro-guide\04-FORM-COMPONENTS.md
