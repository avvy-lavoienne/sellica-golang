# Script to remove all Framer Motion remnants from SalahRekamTable.tsx

$file = "src/components/dashboard/data-rekam/salah-rekam/SalahRekamTable.tsx"
$content = Get-Content $file -Raw

# Remove useReducedMotion line and shouldAnimate
$content = $content -replace '  // Theme and accessibility\r?\n  const prefersReducedMotion = useReducedMotion\(\);\r?\n  const shouldAnimate = !disableAnimations && !prefersReducedMotion;\r?\n\r?\n', ''

# Remove animation variant definitions (containerVariants, itemVariants, rowVariants)
$content = $content -replace '  // Animation variants for enterprise-grade micro-interactions\r?\n(?:  const \w+Variants = \{[^\}]+\};\r?\n\r?\n){3}', ''

# Remove variants props
$content = $content -replace '\s*variants=\{[^\}]+\}', ''

# Remove initial props (both object and string format)
$content = $content -replace '\s*initial=\{[^\}]+\}', ''
$content = $content -replace '\s*initial="[^"]+"', ''

# Remove animate props (both object and string format)
$content = $content -replace '\s*animate=\{[^\}]+\}', ''
$content = $content -replace '\s*animate="[^"]+"', ''

# Remove exit props
$content = $content -replace '\s*exit=\{[^\}]+\}', ''

# Remove whileHover props
$content = $content -replace '\s*whileHover="[^"]+"', ''

# Remove transition props
$content = $content -replace '\s*transition=\{[^\}]+\}', ''

# Remove AnimatePresence components (replace with just the children)
$content = $content -replace '<AnimatePresence(?:\s+mode="[^"]+")?>(\r?\n)', '$1'
$content = $content -replace '</AnimatePresence>', ''

# Save the cleaned content
$content | Set-Content $file -NoNewline

Write-Host "✅ Framer Motion remnants removed successfully!" -ForegroundColor Green
