# SELLY Training Migration - Phase 2: Advanced Persona Migration

**Document**: Phase 2 Advanced Persona Migration - Mood Detection & Cultural Adaptation
**Project Date**: 2025-08-24
**Created**: 2025-08-24
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 📈 High
**Language**: English
**Audience**: Technical Team

---

## 📋 **PHASE 2 OVERVIEW**

### **🎯 Objectives**
- Implement advanced persona adaptation with mood detection
- Migrate 200+ response templates from legacy system
- Create intelligent cultural sensitivity engine
- Establish enhanced training data collection pipeline
- Integrate conversation context and user learning

### **⏱️ Timeline: Days 4-7**
- **Day 4**: Advanced persona adaptation system
- **Day 5**: Response variation and template engine
- **Day 6**: Enhanced training data collection
- **Day 7**: Conversation context and user learning

### **🎯 Success Criteria**
- ✅ SELLY adapts personality based on user mood and context
- ✅ 200+ response templates operational with intelligent selection
- ✅ Cultural sensitivity engine achieving 98%+ appropriateness
- ✅ Training data collection with intelligent prioritization
- ✅ Conversation continuity across sessions

---

## 🧠 **DAY 4: ADVANCED PERSONA ADAPTATION**

### **Task 4.1: Mood Detection Engine**

#### **User Mood Analysis System**
```go
// backend/internal/services/persona/mood_detector.go
package persona

import (
    "context"
    "regexp"
    "strings"
    "time"
)

type MoodDetector struct {
    emotionalPatterns map[string]*regexp.Regexp
    sentimentAnalyzer *SentimentAnalyzer
    contextAnalyzer   *ContextAnalyzer
    cache            *cache.Service
}

type UserMood struct {
    PrimaryEmotion    string    `json:"primary_emotion"`    // "frustrated", "confused", "satisfied", "urgent"
    EmotionIntensity  float64   `json:"emotion_intensity"`  // 0.0 - 1.0
    NeedsWarmth       bool      `json:"needs_warmth"`       // Requires empathetic response
    NeedsEncouragement bool     `json:"needs_encouragement"` // Requires supportive tone
    ShowsFrustration  bool      `json:"shows_frustration"`  // Indicates service difficulty
    NeedsSimpleExplanation bool `json:"needs_simple_explanation"` // Requires simplified language
    UrgencyLevel      string    `json:"urgency_level"`      // "low", "medium", "high", "critical"
    ConfidenceLevel   float64   `json:"confidence_level"`   // Detection confidence
}

func (md *MoodDetector) DetectUserMood(ctx context.Context, query string, conversationHistory []string) (*UserMood, error) {
    mood := &UserMood{
        ConfidenceLevel: 0.7, // Default confidence
    }
    
    // Analyze emotional indicators
    mood.PrimaryEmotion = md.detectPrimaryEmotion(query)
    mood.EmotionIntensity = md.calculateEmotionIntensity(query)
    
    // Detect specific needs
    mood.NeedsWarmth = md.detectWarmthNeed(query, conversationHistory)
    mood.NeedsEncouragement = md.detectEncouragementNeed(query, conversationHistory)
    mood.ShowsFrustration = md.detectFrustration(query, conversationHistory)
    mood.NeedsSimpleExplanation = md.detectComplexityNeed(query)
    mood.UrgencyLevel = md.detectUrgencyLevel(query)
    
    // Cache mood analysis for conversation continuity
    md.cacheMoodAnalysis(ctx, query, mood)
    
    return mood, nil
}

func (md *MoodDetector) detectPrimaryEmotion(query string) string {
    emotionPatterns := map[string][]string{
        "frustrated": {
            "kenapa", "mengapa", "susah", "ribet", "lama", "tidak bisa", "gagal",
            "bingung", "pusing", "capek", "lelah", "stress",
        },
        "confused": {
            "tidak mengerti", "tidak paham", "bingung", "gimana", "bagaimana caranya",
            "maksudnya apa", "apa itu", "jelaskan",
        },
        "urgent": {
            "urgent", "mendesak", "cepat", "segera", "penting", "butuh sekarang",
            "deadline", "batas waktu", "terburu-buru",
        },
        "satisfied": {
            "terima kasih", "makasih", "bagus", "baik", "membantu", "jelas",
            "paham", "mengerti", "oke", "siap",
        },
    }
    
    queryLower := strings.ToLower(query)
    emotionScores := make(map[string]int)
    
    for emotion, patterns := range emotionPatterns {
        for _, pattern := range patterns {
            if strings.Contains(queryLower, pattern) {
                emotionScores[emotion]++
            }
        }
    }
    
    // Find highest scoring emotion
    maxScore := 0
    primaryEmotion := "neutral"
    for emotion, score := range emotionScores {
        if score > maxScore {
            maxScore = score
            primaryEmotion = emotion
        }
    }
    
    return primaryEmotion
}
```

### **Task 4.2: Dynamic Persona Adaptation**

#### **Persona Adaptation Engine**
```go
// backend/internal/services/persona/adaptation_engine.go
type PersonaAdaptationEngine struct {
    basePersonality   *PersonaConfig
    adaptationRules   map[string]*AdaptationRule
    culturalProcessor *IndonesianCulturalProcessor
    moodDetector     *MoodDetector
}

type PersonaAdaptation struct {
    PersonalityAdjustments struct {
        Warmth       float64 `json:"warmth"`       // Adjusted warmth level
        Formality    float64 `json:"formality"`    // Adjusted formality level
        Enthusiasm   float64 `json:"enthusiasm"`   // Adjusted enthusiasm level
        Patience     float64 `json:"patience"`     // Adjusted patience level
        Helpfulness  float64 `json:"helpfulness"`  // Adjusted helpfulness level
    } `json:"personality_adjustments"`
    
    ResponseModifications struct {
        GreetingStyle       string `json:"greeting_style"`       // "formal", "warm", "encouraging"
        ExplanationApproach string `json:"explanation_approach"` // "simplified", "standard", "detailed"
        EncouragementLevel  string `json:"encouragement_level"`  // "high", "moderate", "low"
        ClosingStyle        string `json:"closing_style"`        // "formal", "friendly", "supportive"
    } `json:"response_modifications"`
    
    LinguisticAdaptations struct {
        VocabularyLevel    string   `json:"vocabulary_level"`    // "simple", "standard", "advanced"
        SentenceStructure  string   `json:"sentence_structure"`  // "simple", "compound", "complex"
        CulturalReferences []string `json:"cultural_references"` // Appropriate cultural context
        AddressForms       []string `json:"address_forms"`       // "kak", "kakak", "bapak_ibu"
    } `json:"linguistic_adaptations"`
}

func (pae *PersonaAdaptationEngine) GeneratePersonaAdaptation(
    ctx context.Context,
    userMood *UserMood,
    culturalCtx *CulturalContext,
    conversationCtx *ConversationContext,
) (*PersonaAdaptation, error) {
    adaptation := &PersonaAdaptation{}
    
    // Adjust personality based on mood
    adaptation.PersonalityAdjustments.Warmth = pae.calculateWarmthLevel(userMood, culturalCtx)
    adaptation.PersonalityAdjustments.Formality = pae.calculateFormalityLevel(userMood, culturalCtx)
    adaptation.PersonalityAdjustments.Enthusiasm = pae.calculateEnthusiasmLevel(userMood)
    adaptation.PersonalityAdjustments.Patience = pae.calculatePatienceLevel(userMood)
    adaptation.PersonalityAdjustments.Helpfulness = 0.95 // Always high for government services
    
    // Modify response approach
    adaptation.ResponseModifications = pae.generateResponseModifications(userMood, culturalCtx)
    
    // Adapt linguistic style
    adaptation.LinguisticAdaptations = pae.generateLinguisticAdaptations(userMood, culturalCtx)
    
    return adaptation, nil
}

func (pae *PersonaAdaptationEngine) calculateWarmthLevel(mood *UserMood, cultural *CulturalContext) float64 {
    baseWarmth := pae.basePersonality.Personality.Warmth
    
    // Increase warmth for frustrated or confused users
    if mood.NeedsWarmth || mood.ShowsFrustration || mood.PrimaryEmotion == "confused" {
        baseWarmth = math.Min(baseWarmth + 0.2, 1.0)
    }
    
    // Adjust for cultural context
    if cultural.FormalityLevel == "formal" {
        baseWarmth = math.Max(baseWarmth - 0.1, 0.5) // Maintain professional warmth
    }
    
    return baseWarmth
}
```

### **Task 4.3: Response Enhancement System**

#### **Intelligent Response Enhancer**
```go
// backend/internal/services/persona/response_enhancer.go
type ResponseEnhancer struct {
    templateEngine    *TemplateEngine
    culturalProcessor *IndonesianCulturalProcessor
    adaptationEngine  *PersonaAdaptationEngine
    qualityValidator  *ResponseQualityValidator
}

func (re *ResponseEnhancer) EnhanceResponse(
    ctx context.Context,
    originalResponse string,
    adaptation *PersonaAdaptation,
    culturalCtx *CulturalContext,
    userCtx *UserContext,
) (string, error) {
    // Step 1: Apply persona identity if missing
    response := re.ensurePersonaIdentity(originalResponse, culturalCtx)
    
    // Step 2: Adjust tone based on adaptation
    response = re.adjustResponseTone(response, adaptation)
    
    // Step 3: Apply cultural sensitivity
    response = re.applyCulturalSensitivity(response, culturalCtx)
    
    // Step 4: Add appropriate greeting/closing
    response = re.addGreetingAndClosing(response, adaptation, culturalCtx)
    
    // Step 5: Validate response quality
    if err := re.qualityValidator.ValidateResponse(response, culturalCtx); err != nil {
        logrus.WithError(err).Warn("Response quality validation failed")
        // Apply fallback enhancement
        response = re.applyFallbackEnhancement(originalResponse, culturalCtx)
    }
    
    return response, nil
}

func (re *ResponseEnhancer) ensurePersonaIdentity(response string, culturalCtx *CulturalContext) string {
    // Check if SELLY identity is already present
    if strings.Contains(strings.ToLower(response), "selly") {
        return response
    }
    
    // Add appropriate SELLY introduction based on context
    var introduction string
    if culturalCtx.GovernmentContext || culturalCtx.FormalityLevel == "formal" {
        introduction = "Saya SELLY dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. "
    } else {
        introduction = "Saya SELLY, asisten AI untuk layanan administrasi kependudukan. "
    }
    
    return introduction + response
}
```

---

## 📝 **DAY 5: RESPONSE TEMPLATE ENGINE**

### **Task 5.1: Template Management System**

#### **Response Template Engine**
```go
// backend/internal/services/persona/template_engine.go
type TemplateEngine struct {
    templates        map[string]*ResponseTemplate
    templateSelector *TemplateSelector
    variableResolver *VariableResolver
    cache           *cache.Service
}

type ResponseTemplate struct {
    ID               string            `json:"id"`
    Category         string            `json:"category"`         // "greeting", "explanation", "error", "closing"
    Subcategory      string            `json:"subcategory"`      // "morning", "afternoon", "ktp", "akta"
    FormalityLevel   string            `json:"formality_level"`  // "formal", "semi-formal", "casual"
    EmotionalTone    string            `json:"emotional_tone"`   // "warm", "professional", "encouraging"
    Template         string            `json:"template"`         // Template with variables
    Variables        []string          `json:"variables"`        // Required variables
    CulturalContext  []string          `json:"cultural_context"` // Applicable cultural contexts
    UsageCount       int64             `json:"usage_count"`      // Usage statistics
    SuccessRate      float64           `json:"success_rate"`     // User satisfaction rate
}

func (te *TemplateEngine) SelectTemplate(
    ctx context.Context,
    category string,
    adaptation *PersonaAdaptation,
    culturalCtx *CulturalContext,
    userMood *UserMood,
) (*ResponseTemplate, error) {
    // Build selection criteria
    criteria := &TemplateSelectionCriteria{
        Category:        category,
        FormalityLevel:  culturalCtx.FormalityLevel,
        EmotionalTone:   te.determineEmotionalTone(userMood, adaptation),
        CulturalContext: culturalCtx,
        TimeContext:     culturalCtx.TimeContext,
    }
    
    // Get matching templates
    candidates := te.getMatchingTemplates(criteria)
    if len(candidates) == 0 {
        return te.getFallbackTemplate(category, culturalCtx.FormalityLevel), nil
    }
    
    // Select best template based on success rate and usage patterns
    selectedTemplate := te.templateSelector.SelectBestTemplate(candidates, userMood)
    
    return selectedTemplate, nil
}
```

### **Task 5.2: Government Service Templates**

#### **Specialized Government Service Templates**
```go
// backend/internal/services/persona/government_templates.go
func (te *TemplateEngine) LoadGovernmentServiceTemplates() {
    templates := []*ResponseTemplate{
        // KTP Service Templates
        {
            ID:              "ktp_explanation_formal",
            Category:        "explanation",
            Subcategory:     "ktp",
            FormalityLevel:  "formal",
            EmotionalTone:   "professional",
            Template:        "Untuk membuat KTP baru, Bapak/Ibu perlu menyiapkan dokumen berikut: {{documents}}. Proses pembuatan memerlukan waktu {{processing_time}} hari kerja. {{additional_info}}",
            Variables:       []string{"documents", "processing_time", "additional_info"},
            CulturalContext: []string{"government", "formal"},
        },
        {
            ID:              "ktp_explanation_friendly",
            Category:        "explanation", 
            Subcategory:     "ktp",
            FormalityLevel:  "semi-formal",
            EmotionalTone:   "warm",
            Template:        "Untuk buat KTP baru, kak perlu siapkan dokumen ini: {{documents}}. Prosesnya sekitar {{processing_time}} hari kerja ya. {{additional_info}}",
            Variables:       []string{"documents", "processing_time", "additional_info"},
            CulturalContext: []string{"government", "friendly"},
        },
        
        // Greeting Templates
        {
            ID:              "morning_greeting_formal",
            Category:        "greeting",
            Subcategory:     "morning",
            FormalityLevel:  "formal",
            EmotionalTone:   "professional",
            Template:        "Selamat pagi, Bapak/Ibu. Saya SELLY dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Semoga hari ini menjadi hari yang produktif. Bagaimana saya bisa membantu Anda?",
            Variables:       []string{},
            CulturalContext: []string{"government", "formal", "morning"},
        },
        {
            ID:              "morning_greeting_warm",
            Category:        "greeting",
            Subcategory:     "morning",
            FormalityLevel:  "semi-formal",
            EmotionalTone:   "warm",
            Template:        "Selamat pagi, kak! Saya SELLY, asisten AI untuk layanan administrasi kependudukan. Semoga harinya menyenangkan ya! Ada yang bisa saya bantu?",
            Variables:       []string{},
            CulturalContext: []string{"government", "friendly", "morning"},
        },
        
        // Error Handling Templates
        {
            ID:              "confusion_response_patient",
            Category:        "error_handling",
            Subcategory:     "confusion",
            FormalityLevel:  "adaptive",
            EmotionalTone:   "patient",
            Template:        "Maaf jika penjelasan saya kurang jelas, {{address}}. Mari saya coba jelaskan dengan cara yang lebih sederhana: {{simplified_explanation}}. Apakah ada bagian tertentu yang ingin saya jelaskan lebih detail?",
            Variables:       []string{"address", "simplified_explanation"},
            CulturalContext: []string{"government", "patient", "helpful"},
        },
        
        // Encouragement Templates
        {
            ID:              "encouragement_supportive",
            Category:        "encouragement",
            Subcategory:     "general",
            FormalityLevel:  "adaptive",
            EmotionalTone:   "supportive",
            Template:        "Jangan khawatir, {{address}}. Proses administrasi memang terkadang terasa rumit, tapi saya akan membantu {{user_name}} sampai selesai. {{reassurance}} Mari kita selesaikan satu per satu ya.",
            Variables:       []string{"address", "user_name", "reassurance"},
            CulturalContext: []string{"government", "supportive", "encouraging"},
        },
    }
    
    // Load templates into engine
    for _, template := range templates {
        te.templates[template.ID] = template
    }
}
```

---

## 📊 **DAY 6: ENHANCED TRAINING DATA COLLECTION**

### **Task 6.1: Intelligent Training Data Collector**

#### **Advanced Training Data Collection System**
```go
// backend/internal/services/training/enhanced_collector.go
type EnhancedTrainingDataCollector struct {
    baseCollector     *DataCollector
    personaAnalyzer   *PersonaAnalyzer
    qualityAssessor   *QualityAssessor
    priorityCalculator *PriorityCalculator
    conversationTracker *ConversationTracker
    cache            *cache.Service
    db               *database.Service
}

type EnhancedTrainingData struct {
    // Base training data
    TrainingData
    
    // Enhanced metadata
    PersonaContext struct {
        UserMood         *UserMood         `json:"user_mood"`
        CulturalContext  *CulturalContext  `json:"cultural_context"`
        PersonaAdaptation *PersonaAdaptation `json:"persona_adaptation"`
        TemplateUsed     string            `json:"template_used"`
    } `json:"persona_context"`
    
    ConversationContext struct {
        ConversationID   string   `json:"conversation_id"`
        MessageSequence  int      `json:"message_sequence"`
        PreviousQueries  []string `json:"previous_queries"`
        UserSatisfaction float64  `json:"user_satisfaction"`
        ResolutionStatus string   `json:"resolution_status"` // "resolved", "ongoing", "escalated"
    } `json:"conversation_context"`
    
    QualityMetrics struct {
        CulturalAppropriateness float64 `json:"cultural_appropriateness"`
        PersonaConsistency      float64 `json:"persona_consistency"`
        ResponseRelevance       float64 `json:"response_relevance"`
        UserEngagement         float64 `json:"user_engagement"`
        OverallQuality         float64 `json:"overall_quality"`
    } `json:"quality_metrics"`
    
    LearningValue struct {
        TrainingPriority    int     `json:"training_priority"`    // 1-10 scale
        LearningPotential   float64 `json:"learning_potential"`   // 0.0-1.0
        NoveltyScore       float64 `json:"novelty_score"`        // 0.0-1.0
        ComplexityLevel    string  `json:"complexity_level"`     // "simple", "medium", "complex"
    } `json:"learning_value"`
}

func (etdc *EnhancedTrainingDataCollector) CollectTrainingData(
    ctx context.Context,
    request *AIRequest,
    response *AIResponse,
    personaContext *PersonaContext,
) error {
    // Create enhanced training data
    trainingData := &EnhancedTrainingData{
        TrainingData: TrainingData{
            Query:     request.Query,
            Response:  response.Response,
            UserID:    request.UserID,
            SessionID: request.SessionID,
            Timestamp: time.Now(),
            Classification: map[string]interface{}{
                "service_type": etdc.classifyServiceType(request.Query),
                "intent":       etdc.classifyIntent(request.Query),
                "confidence":   response.Confidence,
            },
            Metadata: map[string]interface{}{
                "processing_time": response.ProcessingTime,
                "provider_used":   response.Provider,
                "enhancement_mode": request.EnhancementMode,
            },
        },
    }
    
    // Enhance with persona context
    trainingData.PersonaContext.UserMood = personaContext.UserMood
    trainingData.PersonaContext.CulturalContext = personaContext.CulturalContext
    trainingData.PersonaContext.PersonaAdaptation = personaContext.Adaptation
    trainingData.PersonaContext.TemplateUsed = personaContext.TemplateUsed
    
    // Analyze conversation context
    trainingData.ConversationContext = etdc.analyzeConversationContext(ctx, request)
    
    // Assess quality metrics
    trainingData.QualityMetrics = etdc.assessQualityMetrics(ctx, trainingData)
    
    // Calculate learning value
    trainingData.LearningValue = etdc.calculateLearningValue(ctx, trainingData)
    
    // Store training data asynchronously
    go etdc.storeTrainingData(ctx, trainingData)
    
    return nil
}
```

### **Task 6.2: Training Priority System**

#### **Intelligent Priority Calculator**
```go
// backend/internal/services/training/priority_calculator.go
type PriorityCalculator struct {
    serviceWeights    map[string]float64
    complexityWeights map[string]float64
    qualityWeights    map[string]float64
    noveltyDetector   *NoveltyDetector
}

func (pc *PriorityCalculator) CalculateTrainingPriority(
    ctx context.Context,
    trainingData *EnhancedTrainingData,
) int {
    var priority float64
    
    // Service type weight (government services get higher priority)
    serviceType := trainingData.Classification["service_type"].(string)
    priority += pc.serviceWeights[serviceType] * 0.3
    
    // Quality metrics weight
    priority += trainingData.QualityMetrics.OverallQuality * 0.25
    
    // Novelty score weight (new patterns get higher priority)
    priority += trainingData.LearningValue.NoveltyScore * 0.2
    
    // User satisfaction weight
    priority += trainingData.ConversationContext.UserSatisfaction * 0.15
    
    // Complexity weight (complex queries need more training)
    complexityScore := pc.complexityWeights[trainingData.LearningValue.ComplexityLevel]
    priority += complexityScore * 0.1
    
    // Convert to 1-10 scale
    priorityInt := int(math.Round(priority * 10))
    if priorityInt < 1 {
        priorityInt = 1
    }
    if priorityInt > 10 {
        priorityInt = 10
    }
    
    return priorityInt
}
```

---

## 🔄 **DAY 7: CONVERSATION CONTEXT & USER LEARNING**

### **Task 7.1: Conversation Context Manager**

#### **Advanced Conversation Context System**
```go
// backend/internal/services/persona/conversation_context.go
type ConversationContextManager struct {
    contextStore     *ConversationStore
    userProfiler     *UserProfiler
    sessionManager   *SessionManager
    cache           *cache.Service
    db              *database.Service
}

type ConversationContext struct {
    ConversationID     string                 `json:"conversation_id"`
    UserID            string                 `json:"user_id"`
    SessionID         string                 `json:"session_id"`
    StartTime         time.Time              `json:"start_time"`
    LastActivity      time.Time              `json:"last_activity"`
    MessageCount      int                    `json:"message_count"`
    
    UserProfile struct {
        PreferredFormality string   `json:"preferred_formality"`
        PreferredAddress   string   `json:"preferred_address"`
        CommonServices     []string `json:"common_services"`
        LanguagePreference string   `json:"language_preference"`
        CulturalBackground string   `json:"cultural_background"`
    } `json:"user_profile"`
    
    ConversationFlow struct {
        CurrentTopic       string            `json:"current_topic"`
        TopicHistory       []string          `json:"topic_history"`
        ResolutionStatus   string            `json:"resolution_status"`
        SatisfactionScore  float64           `json:"satisfaction_score"`
        FollowUpNeeded     bool              `json:"follow_up_needed"`
        EscalationLevel    int               `json:"escalation_level"`
    } `json:"conversation_flow"`
    
    PersonaAdaptations []PersonaAdaptation `json:"persona_adaptations"`
    QualityMetrics     ConversationQuality `json:"quality_metrics"`
}

func (ccm *ConversationContextManager) UpdateConversationContext(
    ctx context.Context,
    conversationID string,
    request *AIRequest,
    response *AIResponse,
    personaContext *PersonaContext,
) error {
    // Get or create conversation context
    convCtx, err := ccm.getOrCreateConversationContext(ctx, conversationID, request.UserID)
    if err != nil {
        return fmt.Errorf("failed to get conversation context: %w", err)
    }
    
    // Update conversation flow
    convCtx.MessageCount++
    convCtx.LastActivity = time.Now()
    convCtx.ConversationFlow.CurrentTopic = ccm.extractTopic(request.Query)
    convCtx.ConversationFlow.TopicHistory = append(convCtx.ConversationFlow.TopicHistory, convCtx.ConversationFlow.CurrentTopic)
    
    // Update user profile based on interaction patterns
    ccm.updateUserProfile(convCtx, personaContext)
    
    // Store persona adaptation for learning
    convCtx.PersonaAdaptations = append(convCtx.PersonaAdaptations, *personaContext.Adaptation)
    
    // Update quality metrics
    convCtx.QualityMetrics = ccm.calculateConversationQuality(convCtx, response)
    
    // Persist context
    return ccm.contextStore.SaveConversationContext(ctx, convCtx)
}
```

### **Task 7.2: User Learning System**

#### **Adaptive User Learning Engine**
```go
// backend/internal/services/persona/user_learning.go
type UserLearningEngine struct {
    profileManager   *UserProfileManager
    adaptationLearner *AdaptationLearner
    preferenceTracker *PreferenceTracker
    cache           *cache.Service
    db              *database.Service
}

type UserLearningProfile struct {
    UserID           string    `json:"user_id"`
    CreatedAt        time.Time `json:"created_at"`
    LastUpdated      time.Time `json:"last_updated"`
    InteractionCount int       `json:"interaction_count"`
    
    LearnedPreferences struct {
        PreferredFormality     string   `json:"preferred_formality"`
        PreferredAddress       string   `json:"preferred_address"`
        PreferredResponseStyle string   `json:"preferred_response_style"`
        PreferredExplanationLevel string `json:"preferred_explanation_level"`
        CommonServiceTypes     []string `json:"common_service_types"`
        TypicalQueryPatterns   []string `json:"typical_query_patterns"`
    } `json:"learned_preferences"`
    
    PersonaAdaptationHistory []PersonaAdaptationRecord `json:"persona_adaptation_history"`
    
    SatisfactionMetrics struct {
        AverageSatisfaction    float64 `json:"average_satisfaction"`
        SatisfactionTrend      []float64 `json:"satisfaction_trend"`
        BestAdaptationSettings *PersonaAdaptation `json:"best_adaptation_settings"`
        WorstAdaptationSettings *PersonaAdaptation `json:"worst_adaptation_settings"`
    } `json:"satisfaction_metrics"`
}

func (ule *UserLearningEngine) LearnFromInteraction(
    ctx context.Context,
    userID string,
    interaction *InteractionData,
    satisfaction float64,
) error {
    // Get or create user learning profile
    profile, err := ule.getOrCreateUserProfile(ctx, userID)
    if err != nil {
        return fmt.Errorf("failed to get user profile: %w", err)
    }
    
    // Update interaction count
    profile.InteractionCount++
    profile.LastUpdated = time.Now()
    
    // Learn from persona adaptation effectiveness
    adaptationRecord := PersonaAdaptationRecord{
        Timestamp:        time.Now(),
        Adaptation:       interaction.PersonaAdaptation,
        UserSatisfaction: satisfaction,
        QueryType:        interaction.QueryType,
        ServiceType:      interaction.ServiceType,
    }
    profile.PersonaAdaptationHistory = append(profile.PersonaAdaptationHistory, adaptationRecord)
    
    // Update learned preferences
    ule.updateLearnedPreferences(profile, interaction, satisfaction)
    
    // Update satisfaction metrics
    ule.updateSatisfactionMetrics(profile, satisfaction)
    
    // Identify best adaptation settings
    ule.identifyBestAdaptationSettings(profile)
    
    // Persist learning profile
    return ule.profileManager.SaveUserProfile(ctx, profile)
}
```

---

## 📊 **SUCCESS METRICS & VALIDATION**

### **Performance Targets**
- **Persona Adaptation Time**: <20ms additional processing
- **Template Selection Time**: <10ms
- **Cultural Context Analysis**: <15ms
- **Training Data Collection**: <5ms (asynchronous)
- **Overall Response Time**: Maintain <100ms average

### **Quality Metrics**
- **Cultural Appropriateness**: 98%+ accuracy
- **Persona Consistency**: 100% SELLY identity maintenance
- **Mood Detection Accuracy**: 85%+ correct mood identification
- **Template Effectiveness**: 90%+ user satisfaction with selected templates
- **Learning Effectiveness**: 15%+ improvement in user satisfaction over time

### **Validation Checklist**
- [ ] Mood detection system operational and accurate
- [ ] Persona adaptation responding to user emotional state
- [ ] 200+ response templates loaded and selectable
- [ ] Cultural sensitivity engine achieving target accuracy
- [ ] Enhanced training data collection with quality metrics
- [ ] Conversation context maintained across sessions
- [ ] User learning profiles being created and updated
- [ ] Performance targets met
- [ ] Integration tests passing

---

## 🚀 **NEXT STEPS**

Upon successful completion of Phase 2:
1. **Phase 3**: Specialized training modules for government services
2. **Phase 4**: Production optimization and advanced monitoring

**Phase 2 transforms SELLY from a basic persona system into an emotionally intelligent, culturally sensitive AI assistant that learns and adapts to individual users while maintaining professional government service standards.**
