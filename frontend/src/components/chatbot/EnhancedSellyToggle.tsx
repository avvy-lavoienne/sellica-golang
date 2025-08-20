/**
 * Enhanced SELLY Toggle Component
 * Allows users to switch between Standard and Enhanced modes
 */

'use client';

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import {
  SparklesIcon,
  BoltIcon,
  CogIcon,
  ChartBarIcon as Activity,
  BoltIcon as Zap,
  CpuChipIcon as Brain,
  GlobeAltIcon as Globe
} from '@heroicons/react/24/outline';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/conn/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EnhancedSellyToggleProps {
  onModeChange: (enhanced: boolean) => void;
  initialMode?: boolean;
  showAdvancedOptions?: boolean;
  className?: string;
  delay?: number;
  disableAnimations?: boolean;
}

interface AdvancedOptions {
  enableVariations: boolean;
  enablePersonalization: boolean;
  enableCulturalAdaptation: boolean;
  performanceMode: 'fast' | 'balanced' | 'comprehensive';
}

// Memoized backdrop effects component for performance
const BackdropEffects = memo(({ enhancedMode }: { enhancedMode: boolean }) => (
  <div className="absolute inset-0 opacity-40">
    {/* Primary glow effect with animation */}
    <div
      className={cn(
        "absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl transition-colors duration-1000 animate-pulse",
        enhancedMode ? 'bg-primary/25' : 'bg-blue-500/25'
      )}
    />
    {/* Secondary glow effect */}
    <div
      className={cn(
        "absolute -bottom-6 -left-6 h-20 w-20 rounded-full blur-2xl transition-colors duration-1000",
        enhancedMode ? 'bg-primary/20' : 'bg-indigo-500/20'
      )}
    />
    {/* Tertiary accent glow */}
    <div
      className={cn(
        "absolute top-1/2 right-1/4 h-12 w-12 rounded-full blur-xl transition-colors duration-1000",
        enhancedMode ? 'bg-primary/15' : 'bg-cyan-500/15'
      )}
    />
  </div>
));

BackdropEffects.displayName = 'BackdropEffects';

// Enhanced OptionCard component for better visual hierarchy
const OptionCard = memo(({
  title,
  description,
  checked,
  onChange,
  icon
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (enabled: boolean) => void;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 transition-all duration-200 hover:bg-muted/40">
    <div className="flex items-center space-x-3 min-w-0 flex-1">
      <div className="p-1.5 rounded-lg bg-background/60 border border-border/40">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <label className="text-sm font-medium text-foreground cursor-pointer">
          {title}
        </label>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </div>
    </div>
    <Switch
      checked={checked}
      onChange={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300",
        checked
          ? 'bg-primary shadow-lg shadow-primary/30'
          : 'bg-muted shadow-inner'
      )}
    >
      <span
        className={cn(
          "inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-300",
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </Switch>
  </div>
));

OptionCard.displayName = 'OptionCard';

export const EnhancedSellyToggle: React.FC<EnhancedSellyToggleProps> = ({
  onModeChange,
  initialMode = false,
  showAdvancedOptions = false,
  className = '',
  delay = 0,
  disableAnimations = false
}) => {
  const [enhancedMode, setEnhancedMode] = useState(initialMode);
  const [showOptions, setShowOptions] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
    enableVariations: false,
    enablePersonalization: true,
    enableCulturalAdaptation: true,
    performanceMode: 'balanced'
  });

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Memoized color schemes matching dashboard design system
  const colorSchemes = useMemo(() => ({
    enhanced: {
      primary: 'text-primary',
      accent: 'text-primary/80',
      bgClass: 'bg-primary/8',
      borderClass: 'border-primary/25',
      glowClass: 'shadow-primary/25',
      gradientClass: 'bg-gradient-to-r from-primary/80 to-primary/60',
      shadowClass: 'shadow-lg shadow-primary/20',
      iconBg: 'bg-primary/10',
      iconBorder: 'border-primary/20',
    },
    standard: {
      primary: 'text-blue-600 dark:text-blue-400',
      accent: 'text-blue-500 dark:text-blue-300',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      borderClass: 'border-blue-200/60 dark:border-blue-700/60',
      glowClass: 'shadow-blue-500/25',
      gradientClass: 'bg-gradient-to-r from-blue-500 to-blue-600',
      shadowClass: 'shadow-lg shadow-blue-500/20',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBorder: 'border-blue-200/60 dark:border-blue-700/60',
    }
  }), []);

  const currentColors = enhancedMode ? colorSchemes.enhanced : colorSchemes.standard;

  useEffect(() => {
    // Load user preferences from localStorage
    const savedMode = localStorage.getItem('selly-enhanced-mode');
    const savedOptions = localStorage.getItem('selly-advanced-options');
    
    if (savedMode !== null) {
      const isEnhanced = savedMode === 'true';
      setEnhancedMode(isEnhanced);
      onModeChange(isEnhanced);
    }
    
    if (savedOptions) {
      try {
        setAdvancedOptions(JSON.parse(savedOptions));
      } catch (error) {
        console.warn('Failed to parse saved advanced options:', error);
      }
    }
  }, [onModeChange]);

  // Enhanced animation variants matching dashboard patterns
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
      },
    },
  };

  const handleModeToggle = useCallback((enabled: boolean) => {
    setEnhancedMode(enabled);
    onModeChange(enabled);

    // Save to localStorage
    localStorage.setItem('selly-enhanced-mode', enabled.toString());

    console.log(`🔄 [ENHANCED_TOGGLE] Mode changed to: ${enabled ? 'Enhanced' : 'Standard'}`);
  }, [onModeChange]);

  const handleAdvancedOptionChange = useCallback((option: keyof AdvancedOptions, value: any) => {
    const newOptions = { ...advancedOptions, [option]: value };
    setAdvancedOptions(newOptions);

    // Save to localStorage
    localStorage.setItem('selly-advanced-options', JSON.stringify(newOptions));

    console.log(`⚙️ [ENHANCED_TOGGLE] Advanced option changed:`, { [option]: value });
  }, [advancedOptions]);

  // Calculate active features count
  const activeFeatureCount = useMemo(() => {
    const baseFeatures = enhancedMode ? 3 : 4; // Base features
    const advancedFeatures = Object.values(advancedOptions).filter(Boolean).length;
    return baseFeatures + advancedFeatures;
  }, [enhancedMode, advancedOptions]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-4 sm:space-y-6", className)}
      role="region"
      aria-labelledby="selly-toggle-heading"
      aria-describedby="selly-toggle-description"
    >
      <h3 id="selly-toggle-heading" className="sr-only">
        SELLY Mode Toggle
      </h3>
      <p id="selly-toggle-description" className="sr-only">
        Switch between standard and enhanced AI modes
      </p>

      {/* Live region for status updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {enhancedMode ? 'Enhanced mode active' : 'Standard mode active'}
      </div>

      {/* Main Toggle with Multi-layer Glass-morphism */}
      <motion.div variants={itemVariants}>
        <div className="group relative overflow-hidden rounded-2xl border backdrop-blur-md bg-background/85 shadow-xl border-border/40 p-4 sm:p-5 lg:p-6 transition-all duration-500 hover:shadow-2xl hover:bg-background/90">
          {/* Primary glass layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/60 backdrop-blur-sm" />

          {/* Secondary reflection layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:via-white/2 dark:to-white/5" />

          {/* Enhanced background decoration with multiple layers */}
          <BackdropEffects enhancedMode={enhancedMode} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Enhanced Icon Container */}
              <div className={cn(
                "flex items-center justify-center rounded-2xl border p-2 sm:p-3 transition-all duration-500",
                currentColors.iconBg,
                currentColors.iconBorder,
                currentColors.shadowClass
              )}>
                {enhancedMode ? (
                  <SparklesIcon className={cn("h-5 w-5 sm:h-6 sm:w-6", currentColors.primary)} />
                ) : (
                  <BoltIcon className={cn("h-5 w-5 sm:h-6 sm:w-6", currentColors.primary)} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-foreground leading-tight">
                  {enhancedMode ? 'SELLY Advanced' : 'SELLY'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {enhancedMode
                    ? 'Adaptive, personalized responses with AI enhancement'
                    : 'Fast, reliable responses with local processing'
                  }
                </p>
                {/* Feature count indicator */}
                <div className="flex items-center mt-3 space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      enhancedMode ? 'bg-primary' : 'bg-blue-500'
                    )} />
                    <span className="text-xs font-medium text-muted-foreground">
                      {activeFeatureCount} features active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3">
              {showAdvancedOptions && (
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    showOptions
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  title="Advanced Options"
                  aria-expanded={showOptions}
                  aria-controls="advanced-options-panel"
                >
                  <CogIcon className="h-4 w-4" />
                </button>
              )}

              {/* Enhanced Toggle Switch with micro-interactions */}
              <Switch
                checked={enhancedMode}
                onChange={handleModeToggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModeToggle(!enhancedMode);
                  }
                }}
                aria-describedby="toggle-help"
                className={cn(
                  "relative inline-flex h-6 w-11 sm:h-7 sm:w-12 items-center rounded-full transition-all duration-500",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                  "shadow-inner",
                  enhancedMode
                    ? cn(currentColors.gradientClass, currentColors.shadowClass)
                    : 'bg-gradient-to-r from-muted to-muted/80 shadow-md'
                )}
              >
                <span className="sr-only">
                  {enhancedMode ? 'Disable' : 'Enable'} enhanced mode
                </span>
                <span
                  className={cn(
                    "inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full transition-all duration-500",
                    "shadow-lg ring-0 ring-white ring-opacity-60 flex items-center justify-center",
                    enhancedMode
                      ? 'translate-x-6 sm:translate-x-6 bg-white shadow-primary/20'
                      : 'translate-x-1 bg-white shadow-muted-foreground/20'
                  )}
                >
                  {/* Icon inside toggle */}
                  <div className="flex items-center justify-center h-full w-full">
                    {enhancedMode ? (
                      <SparklesIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                    ) : (
                      <BoltIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500" />
                    )}
                  </div>
                </span>
              </Switch>

              <div id="toggle-help" className="sr-only">
                Press Enter or Space to toggle between modes
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Performance Indicator with Dashboard-style Metrics */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl border backdrop-blur-sm bg-background/90 shadow-lg border-border/40 p-4 transition-all duration-300">
          {/* Background decoration for better contrast */}
          <div className="absolute inset-0 opacity-20">
            <div className={cn(
              "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl transition-colors duration-1000",
              enhancedMode ? 'bg-primary/20' : 'bg-blue-500/20'
            )} />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Animated status indicator */}
              <div className="relative">
                <div className={cn(
                  "w-3 h-3 rounded-full shadow-sm transition-colors duration-500",
                  enhancedMode ? 'bg-primary shadow-primary/50' : 'bg-green-500 shadow-green-500/50'
                )} />
                <div className={cn(
                  "absolute inset-0 w-3 h-3 rounded-full animate-ping",
                  enhancedMode ? 'bg-primary/30' : 'bg-green-500/30'
                )} />
              </div>

              {/* Performance metrics with enhanced background */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/30 backdrop-blur-sm">
                    <span className="text-sm font-semibold text-foreground">
                      Response Time: ~{enhancedMode ? '250' : '150'}ms
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-1.5 bg-muted/60 rounded-full overflow-hidden border border-border/20">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          enhancedMode ? 'bg-primary w-3/4' : 'bg-green-500 w-full'
                        )}
                      />
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-muted/30 border border-border/20">
                      <span className="text-xs font-medium text-foreground">
                        {enhancedMode ? 'Enhanced' : 'Optimal'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-md bg-muted/30 border border-border/20 backdrop-blur-sm">
                  <p className="text-xs font-medium text-muted-foreground">
                    {enhancedMode ? 'AI features active' : 'Standard mode active'}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced feature count badge */}
            {enhancedMode && (
              <div className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl border backdrop-blur-sm transition-all duration-300 shadow-sm",
                currentColors.iconBg,
                currentColors.iconBorder,
                "bg-background/60"
              )}>
                <SparklesIcon className={cn("h-4 w-4", currentColors.primary)} />
                <span className={cn("text-sm font-bold", currentColors.primary)}>
                  {activeFeatureCount} Features
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Advanced Options Panel with Card-based Grouping */}
      {showAdvancedOptions && showOptions && enhancedMode && (
        <motion.div
          variants={itemVariants}
          id="advanced-options-panel"
          role="region"
          aria-labelledby="advanced-options-heading"
        >
          <div className="relative overflow-hidden rounded-2xl border backdrop-blur-md bg-background/85 shadow-xl border-border/40 p-6 transition-all duration-500">
            {/* Enhanced background decoration */}
            <div className="absolute inset-0 opacity-20">
              <div className={cn(
                "absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-30 transition-colors duration-1000",
                currentColors.bgClass
              )} />
              <div className={cn(
                "absolute -bottom-3 -left-3 h-12 w-12 rounded-full blur-xl opacity-25 transition-colors duration-1000",
                currentColors.bgClass
              )} />
            </div>

            <div className="relative z-10">
              {/* Enhanced header with better visual hierarchy */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-xl border transition-all duration-300",
                    currentColors.iconBg,
                    currentColors.iconBorder
                  )}>
                    <CogIcon className={cn("h-5 w-5", currentColors.primary)} />
                  </div>
                  <div>
                    <h4 id="advanced-options-heading" className="text-base font-bold text-foreground">
                      Advanced Options
                    </h4>
                    <p className="text-xs text-muted-foreground">Customize SELLY&apos;s behavior</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Object.values(advancedOptions).filter(Boolean).length} active
                </Badge>
              </div>

              {/* Grouped options with better visual separation */}
              <div className="space-y-6">
                {/* AI Features Group */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <SparklesIcon className={cn("h-4 w-4", currentColors.primary)} />
                    <span>AI Enhancement Features</span>
                  </h5>
                  <div className="grid gap-3">
                    <OptionCard
                      title="Response Variations"
                      description="Generate multiple response styles"
                      checked={advancedOptions.enableVariations}
                      onChange={(enabled) => handleAdvancedOptionChange('enableVariations', enabled)}
                      icon={<Activity className="h-3 w-3 text-muted-foreground" />}
                    />
                    <OptionCard
                      title="Personalization"
                      description="Learn from your preferences"
                      checked={advancedOptions.enablePersonalization}
                      onChange={(enabled) => handleAdvancedOptionChange('enablePersonalization', enabled)}
                      icon={<Brain className="h-3 w-3 text-muted-foreground" />}
                    />
                  </div>
                </div>

                {/* Cultural Features Group */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <Globe className={cn("h-4 w-4", currentColors.primary)} />
                    <span>Cultural & Context Features</span>
                  </h5>
                  <div className="grid gap-3">
                    <OptionCard
                      title="Cultural Adaptation"
                      description="Indonesian context awareness"
                      checked={advancedOptions.enableCulturalAdaptation}
                      onChange={(enabled) => handleAdvancedOptionChange('enableCulturalAdaptation', enabled)}
                      icon={<Globe className="h-3 w-3 text-muted-foreground" />}
                    />
                  </div>
                </div>

                {/* Performance Configuration Group */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <Zap className={cn("h-4 w-4", currentColors.primary)} />
                    <span>Performance Configuration</span>
                  </h5>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Performance Mode
                    </label>
                    <select
                      value={advancedOptions.performanceMode}
                      onChange={(e) => handleAdvancedOptionChange('performanceMode', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 text-sm border rounded-xl backdrop-blur-sm text-foreground transition-all duration-200 shadow-sm",
                        "bg-background/80 border-border",
                        "focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                      )}
                    >
                      <option value="fast">Fast (~200ms) - Basic enhancements</option>
                      <option value="balanced">Balanced (~250ms) - Standard enhancements</option>
                      <option value="comprehensive">Comprehensive (~300ms) - All features</option>
                    </select>

                    {/* Performance indicator */}
                    <div className="mt-3 flex items-center space-x-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            advancedOptions.performanceMode === 'fast' ? 'bg-green-500 w-1/3' :
                            advancedOptions.performanceMode === 'balanced' ? 'bg-yellow-500 w-2/3' :
                            'bg-red-500 w-full'
                          )}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {advancedOptions.performanceMode === 'fast' ? 'Speed' :
                         advancedOptions.performanceMode === 'balanced' ? 'Balance' : 'Features'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Feature Summary with Better Backgrounds */}
                <div className="pt-4 border-t border-border/30">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h6 className="text-sm font-bold text-foreground">Active Features</h6>
                      <Badge variant="outline" className="text-xs font-semibold">
                        {activeFeatureCount} total
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50/50 dark:bg-green-900/20 border border-green-200/40 dark:border-green-700/40">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                        <span className="text-sm font-medium text-foreground">Context Intelligence</span>
                      </div>
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50/50 dark:bg-green-900/20 border border-green-200/40 dark:border-green-700/40">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                        <span className="text-sm font-medium text-foreground">Dynamic Responses</span>
                      </div>
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50/50 dark:bg-green-900/20 border border-green-200/40 dark:border-green-700/40">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                        <span className="text-sm font-medium text-foreground">Persona Adaptation</span>
                      </div>
                      {advancedOptions.enableVariations && (
                        <div className={cn(
                          "flex items-center space-x-3 p-2 rounded-lg border",
                          currentColors.iconBg,
                          currentColors.iconBorder
                        )}>
                          <div className={cn("w-2 h-2 rounded-full shadow-sm", 'bg-primary')} />
                          <span className="text-sm font-medium text-foreground">Response Variations</span>
                        </div>
                      )}
                      {advancedOptions.enablePersonalization && (
                        <div className={cn(
                          "flex items-center space-x-3 p-2 rounded-lg border",
                          currentColors.iconBg,
                          currentColors.iconBorder
                        )}>
                          <div className={cn("w-2 h-2 rounded-full shadow-sm", 'bg-primary')} />
                          <span className="text-sm font-medium text-foreground">Personalization</span>
                        </div>
                      )}
                      {advancedOptions.enableCulturalAdaptation && (
                        <div className={cn(
                          "flex items-center space-x-3 p-2 rounded-lg border",
                          currentColors.iconBg,
                          currentColors.iconBorder
                        )}>
                          <div className={cn("w-2 h-2 rounded-full shadow-sm", 'bg-primary')} />
                          <span className="text-sm font-medium text-foreground">Cultural Adaptation</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Mode Benefits with Better Backgrounds */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/40 bg-background/90 shadow-lg backdrop-blur-sm overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className={cn(
              "absolute -right-6 -bottom-6 h-20 w-20 rounded-full blur-2xl transition-colors duration-1000",
              enhancedMode ? 'bg-primary/30' : 'bg-blue-500/30'
            )} />
          </div>

          <CardContent className="relative z-10 p-5">
            {enhancedMode ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <SparklesIcon className={cn("h-4 w-4", currentColors.primary)} />
                  </div>
                  <h6 className="text-base font-bold text-foreground">Enhanced Benefits</h6>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className={cn("w-2 h-2 rounded-full shadow-sm", 'bg-primary')} />
                    <span className="text-sm font-medium text-foreground">Adaptive responses based on your communication style</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className={cn("w-2 h-2 rounded-full shadow-sm", 'bg-primary')} />
                    <span className="text-sm font-medium text-foreground">Emotional intelligence and mood detection</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className={cn("w-2 h-2 rounded-full shadow-sm", 'bg-primary')} />
                    <span className="text-sm font-medium text-foreground">Cultural context awareness for Indonesian users</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className={cn("w-2 h-2 rounded-full shadow-sm", 'bg-primary')} />
                    <span className="text-sm font-medium text-foreground">Personalized explanations and examples</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className={cn("w-2 h-2 rounded-full shadow-sm", 'bg-primary')} />
                    <span className="text-sm font-medium text-foreground">Learning from your interactions</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/60">
                  <div className="p-1.5 rounded-lg bg-blue-100/60 dark:bg-blue-800/40 border border-blue-200/60 dark:border-blue-700/60">
                    <BoltIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h6 className="text-base font-bold text-foreground">Standard Benefits</h6>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                    <span className="text-sm font-medium text-foreground">Ultra-fast response times (&lt;150ms)</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                    <span className="text-sm font-medium text-foreground">100% reliability with local processing</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                    <span className="text-sm font-medium text-foreground">Zero external dependencies</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                    <span className="text-sm font-medium text-foreground">Consistent performance</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedSellyToggle;
