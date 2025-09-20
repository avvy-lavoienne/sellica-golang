# Monitoring & Maintenance

**Document**: Ongoing Maintenance and Performance Monitoring  
**Version**: 1.0  
**Last Updated**: January 4, 2025  
**Status**: 📋 Planning Phase

---

## 📊 **Monitoring Overview**

The SELLY Comprehensive Chat Logging System requires continuous monitoring to ensure optimal performance, privacy compliance, and data integrity. This document outlines monitoring strategies, maintenance procedures, and automated processes.

### **Monitoring Objectives**
1. **Performance Tracking**: Ensure response times meet targets
2. **Privacy Compliance**: Monitor data retention and anonymization
3. **Data Integrity**: Prevent data loss or corruption
4. **System Health**: Track resource usage and errors
5. **User Experience**: Monitor chat functionality and availability

---

## 📈 **Performance Monitoring**

### **Key Performance Indicators (KPIs)**

```typescript
// File: src/services/monitoring/chatLoggingMonitor.ts

export interface ChatLoggingMetrics {
  // Performance Metrics
  averageLoggingLatency: number;        // Target: <50ms
  apiResponseTime: number;              // Target: <200ms
  databaseQueryTime: number;            // Target: <100ms
  
  // Volume Metrics
  dailyMessageCount: number;
  dailySessionCount: number;
  guestUserPercentage: number;
  
  // Quality Metrics
  errorRate: number;                    // Target: <1%
  dataIntegrityScore: number;           // Target: >99%
  privacyComplianceScore: number;       // Target: 100%
  
  // Resource Metrics
  databaseStorageUsed: number;          // MB
  memoryUsage: number;                  // MB
  cpuUtilization: number;               // Percentage
}

export class ChatLoggingMonitor {
  private metrics: ChatLoggingMetrics;
  private alertThresholds: AlertThresholds;
  private supabase: SupabaseClient;

  constructor() {
    this.alertThresholds = {
      loggingLatency: 100,      // Alert if >100ms
      apiResponseTime: 500,     // Alert if >500ms
      errorRate: 0.05,          // Alert if >5%
      storageGrowth: 1000,      // Alert if >1GB daily growth
      memoryUsage: 512          // Alert if >512MB
    };
  }

  /**
   * Collect real-time performance metrics
   */
  async collectMetrics(): Promise<ChatLoggingMetrics> {
    const startTime = performance.now();

    try {
      const [
        loggingMetrics,
        volumeMetrics,
        qualityMetrics,
        resourceMetrics
      ] = await Promise.all([
        this.collectLoggingMetrics(),
        this.collectVolumeMetrics(),
        this.collectQualityMetrics(),
        this.collectResourceMetrics()
      ]);

      this.metrics = {
        ...loggingMetrics,
        ...volumeMetrics,
        ...qualityMetrics,
        ...resourceMetrics
      };

      // Check for alerts
      await this.checkAlertConditions();

      return this.metrics;
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  private async collectLoggingMetrics(): Promise<Partial<ChatLoggingMetrics>> {
    // Query recent logging performance
    const { data: recentLogs } = await this.supabase
      .from('chat_messages')
      .select('processing_time_ms, timestamp')
      .gte('timestamp', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .order('timestamp', { ascending: false })
      .limit(1000);

    const processingTimes = recentLogs?.map(log => log.processing_time_ms).filter(Boolean) || [];
    
    return {
      averageLoggingLatency: processingTimes.length > 0 
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
        : 0
    };
  }

  private async collectVolumeMetrics(): Promise<Partial<ChatLoggingMetrics>> {
    const today = new Date().toISOString().split('T')[0];
    
    // Daily message count
    const { count: messageCount } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', `${today}T00:00:00.000Z`)
      .lt('timestamp', `${today}T23:59:59.999Z`);

    // Daily session count
    const { count: sessionCount } = await this.supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    // Guest user percentage
    const { count: guestSessions } = await this.supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_type', 'guest')
      .gte('created_at', `${today}T00:00:00.000Z`);

    const guestPercentage = sessionCount > 0 ? (guestSessions / sessionCount) * 100 : 0;

    return {
      dailyMessageCount: messageCount || 0,
      dailySessionCount: sessionCount || 0,
      guestUserPercentage: guestPercentage
    };
  }

  private async collectQualityMetrics(): Promise<Partial<ChatLoggingMetrics>> {
    // Error rate calculation
    const { count: totalMessages } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', new Date(Date.now() - 86400000).toISOString()); // Last 24 hours

    const { count: errorMessages } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('response_type', 'error')
      .gte('timestamp', new Date(Date.now() - 86400000).toISOString());

    const errorRate = totalMessages > 0 ? (errorMessages / totalMessages) : 0;

    // Data integrity check
    const dataIntegrityScore = await this.calculateDataIntegrityScore();

    // Privacy compliance check
    const privacyComplianceScore = await this.calculatePrivacyComplianceScore();

    return {
      errorRate,
      dataIntegrityScore,
      privacyComplianceScore
    };
  }

  private async calculateDataIntegrityScore(): Promise<number> {
    // Check for orphaned messages (messages without sessions)
    const { count: orphanedMessages } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .not('session_id', 'in', 
        `(SELECT id FROM chat_sessions)`
      );

    // Check for sessions without user identification
    const { count: invalidSessions } = await this.supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null)
      .is('guest_uuid', null);

    const { count: totalMessages } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true });

    const integrityIssues = (orphanedMessages || 0) + (invalidSessions || 0);
    const totalRecords = (totalMessages || 0) + (invalidSessions || 0);

    return totalRecords > 0 ? ((totalRecords - integrityIssues) / totalRecords) * 100 : 100;
  }

  private async calculatePrivacyComplianceScore(): Promise<number> {
    // Check for overdue deletions
    const { count: overdueMessages } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .lt('scheduled_deletion_at', new Date().toISOString())
      .is('anonymized_at', null);

    // Check for missing consent records
    const { count: sessionsWithoutConsent } = await this.supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('consent_given', false)
      .eq('session_type', 'authenticated');

    const { count: totalSessions } = await this.supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true });

    const complianceIssues = (overdueMessages || 0) + (sessionsWithoutConsent || 0);
    const totalRecords = totalSessions || 0;

    return totalRecords > 0 ? ((totalRecords - complianceIssues) / totalRecords) * 100 : 100;
  }

  /**
   * Check alert conditions and send notifications
   */
  private async checkAlertConditions(): Promise<void> {
    const alerts: Alert[] = [];

    // Performance alerts
    if (this.metrics.averageLoggingLatency > this.alertThresholds.loggingLatency) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Logging latency exceeded threshold: ${this.metrics.averageLoggingLatency}ms`,
        metric: 'averageLoggingLatency',
        value: this.metrics.averageLoggingLatency,
        threshold: this.alertThresholds.loggingLatency
      });
    }

    // Error rate alerts
    if (this.metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'quality',
        severity: 'critical',
        message: `Error rate exceeded threshold: ${(this.metrics.errorRate * 100).toFixed(2)}%`,
        metric: 'errorRate',
        value: this.metrics.errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }

    // Privacy compliance alerts
    if (this.metrics.privacyComplianceScore < 100) {
      alerts.push({
        type: 'privacy',
        severity: 'high',
        message: `Privacy compliance score below 100%: ${this.metrics.privacyComplianceScore.toFixed(2)}%`,
        metric: 'privacyComplianceScore',
        value: this.metrics.privacyComplianceScore,
        threshold: 100
      });
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }

  private async sendAlerts(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      // Log alert
      console.error(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
      
      // Store alert in database
      await this.supabase
        .from('system_alerts')
        .insert({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          created_at: new Date().toISOString()
        });

      // Send notification (implement based on your notification system)
      await this.sendNotification(alert);
    }
  }
}
```

---

## 🔄 **Automated Maintenance Procedures**

### **Data Retention Automation**

```typescript
// File: src/services/maintenance/dataRetentionAutomation.ts

export class DataRetentionAutomation {
  private supabase: SupabaseClient;
  private config: RetentionConfig;

  constructor() {
    this.config = {
      anonymizationThreshold: 30,    // days
      deletionThreshold: 90,         // days
      batchSize: 1000,              // records per batch
      maxProcessingTime: 300000,     // 5 minutes
      enableBackup: true
    };
  }

  /**
   * Daily data retention process
   * Runs automatically via cron job
   */
  async runDailyRetention(): Promise<RetentionReport> {
    const startTime = Date.now();
    const report: RetentionReport = {
      processedRecords: 0,
      anonymizedRecords: 0,
      deletedRecords: 0,
      errors: [],
      processingTime: 0,
      processedAt: new Date()
    };

    try {
      console.log('🔄 Starting daily data retention process...');

      // Step 1: Anonymize expired data
      const anonymizedCount = await this.anonymizeExpiredData();
      report.anonymizedRecords = anonymizedCount;
      console.log(`✅ Anonymized ${anonymizedCount} records`);

      // Step 2: Delete expired data
      const deletedCount = await this.deleteExpiredData();
      report.deletedRecords = deletedCount;
      console.log(`✅ Deleted ${deletedCount} records`);

      // Step 3: Cleanup orphaned sessions
      const cleanedSessions = await this.cleanupOrphanedSessions();
      console.log(`✅ Cleaned up ${cleanedSessions} orphaned sessions`);

      report.processedRecords = anonymizedCount + deletedCount + cleanedSessions;
      report.processingTime = Date.now() - startTime;

      // Log successful completion
      await this.logRetentionActivity(report);
      console.log(`✅ Data retention completed in ${report.processingTime}ms`);

    } catch (error) {
      report.errors.push(error.message);
      console.error('❌ Data retention failed:', error);
      
      // Send alert for failed retention
      await this.sendRetentionAlert(error);
    }

    return report;
  }

  private async anonymizeExpiredData(): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - this.config.anonymizationThreshold);

    let totalAnonymized = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .update({
          content: '[ANONYMIZED]',
          anonymized_at: new Date().toISOString(),
          conversation_context: {}
        })
        .lt('timestamp', threshold.toISOString())
        .is('anonymized_at', null)
        .limit(this.config.batchSize)
        .select('id');

      if (error) throw error;

      const batchCount = data?.length || 0;
      totalAnonymized += batchCount;
      hasMore = batchCount === this.config.batchSize;

      // Prevent infinite loops
      if (Date.now() - Date.now() > this.config.maxProcessingTime) {
        console.warn('⚠️ Anonymization process timeout, stopping...');
        break;
      }
    }

    return totalAnonymized;
  }

  private async deleteExpiredData(): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - this.config.deletionThreshold);

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .delete()
        .lt('scheduled_deletion_at', threshold.toISOString())
        .limit(this.config.batchSize)
        .select('id');

      if (error) throw error;

      const batchCount = data?.length || 0;
      totalDeleted += batchCount;
      hasMore = batchCount === this.config.batchSize;

      // Prevent infinite loops
      if (Date.now() - Date.now() > this.config.maxProcessingTime) {
        console.warn('⚠️ Deletion process timeout, stopping...');
        break;
      }
    }

    return totalDeleted;
  }

  /**
   * Weekly comprehensive maintenance
   */
  async runWeeklyMaintenance(): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      databaseOptimization: false,
      indexMaintenance: false,
      performanceAnalysis: false,
      securityAudit: false,
      backupVerification: false,
      errors: []
    };

    try {
      // Database optimization
      await this.optimizeDatabase();
      report.databaseOptimization = true;

      // Index maintenance
      await this.maintainIndexes();
      report.indexMaintenance = true;

      // Performance analysis
      await this.analyzePerformance();
      report.performanceAnalysis = true;

      // Security audit
      await this.runSecurityAudit();
      report.securityAudit = true;

      // Backup verification
      await this.verifyBackups();
      report.backupVerification = true;

    } catch (error) {
      report.errors.push(error.message);
      console.error('Weekly maintenance failed:', error);
    }

    return report;
  }
}
```

### **Automated Deployment and Monitoring Setup**

```bash
#!/bin/bash
# File: scripts/setup-monitoring.sh

# Setup monitoring and maintenance automation

echo "🔧 Setting up SELLY Chat Logging monitoring..."

# 1. Create monitoring tables
echo "📊 Creating monitoring tables..."
psql $DATABASE_URL << EOF
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  metric TEXT,
  value DECIMAL,
  threshold DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS retention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processed_records INTEGER DEFAULT 0,
  anonymized_records INTEGER DEFAULT 0,
  deleted_records INTEGER DEFAULT 0,
  processing_time INTEGER DEFAULT 0,
  errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
EOF

# 2. Setup cron jobs for automated maintenance
echo "⏰ Setting up cron jobs..."

# Daily data retention (runs at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * cd /app && npm run maintenance:daily") | crontab -

# Weekly maintenance (runs Sunday at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 0 cd /app && npm run maintenance:weekly") | crontab -

# Hourly metrics collection
(crontab -l 2>/dev/null; echo "0 * * * * cd /app && npm run monitoring:collect") | crontab -

# 3. Setup log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/selly-chat-logging << EOF
/var/log/selly-chat-logging/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# 4. Create monitoring dashboard config
echo "📈 Creating monitoring dashboard..."
mkdir -p /app/monitoring
cat > /app/monitoring/dashboard-config.json << EOF
{
  "dashboards": [
    {
      "name": "Chat Logging Performance",
      "panels": [
        {
          "title": "Message Logging Latency",
          "type": "graph",
          "targets": ["chat_logging_latency"]
        },
        {
          "title": "Daily Message Volume",
          "type": "stat",
          "targets": ["daily_message_count"]
        },
        {
          "title": "Error Rate",
          "type": "gauge",
          "targets": ["error_rate"]
        },
        {
          "title": "Privacy Compliance Score",
          "type": "gauge",
          "targets": ["privacy_compliance_score"]
        }
      ]
    }
  ]
}
EOF

echo "✅ Monitoring setup completed!"
echo "📋 Next steps:"
echo "  1. Configure notification endpoints in environment variables"
echo "  2. Set up monitoring dashboard access"
echo "  3. Test automated maintenance procedures"
echo "  4. Review and adjust alert thresholds"
```

---

## 📋 **Maintenance Checklist**

### **Daily Maintenance Tasks**
```bash
□ Run automated data retention process
□ Check system alerts and error logs
□ Verify backup completion
□ Monitor performance metrics
□ Review privacy compliance scores
```

### **Weekly Maintenance Tasks**
```bash
□ Database performance optimization
□ Index maintenance and analysis
□ Security audit and vulnerability scan
□ Backup verification and restore testing
□ Performance trend analysis
□ Capacity planning review
```

### **Monthly Maintenance Tasks**
```bash
□ Comprehensive system health review
□ Privacy compliance audit
□ Performance benchmark comparison
□ Documentation updates
□ Disaster recovery testing
□ Stakeholder reporting
```

---

**Final**: This completes the comprehensive documentation for the SELLY Chat Logging System implementation plan. All documents are now available in the `docs/plan/log-chat-plan/` directory for reference during development.
