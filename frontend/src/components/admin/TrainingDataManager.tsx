'use client';

import React, { useState, useEffect } from 'react';
// import { UnansweredQuery } from '@/services/chatbot/trainingDataCollector'; // Disabled for core build
type UnansweredQuery = {
  id: string;
  query: string;
  timestamp: string;
  context?: any;
  detectedServiceType: string;
  priority: string;
  status: string;
  category?: string;
  confidence?: number;
  userFeedback?: string;
  metadata?: {
    tags?: string[];
    source?: string;
    sessionId?: string;
    [key: string]: any;
  };
}; // Mock type for core build
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Undo2,
  Filter,
  Search,
  TrendingUp,
  Database,
  Users,
  Calendar,
  Tag,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';

interface TrainingStats {
  total: number;
  pending: number;
  inTraining: number;
  resolved: number;
  byService: Record<string, number>;
  byPriority: Record<string, number>;
}

interface ConfirmationDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type: 'danger' | 'warning' | 'info';
}

export function TrainingDataManager() {
  const [queries, setQueries] = useState<UnansweredQuery[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    type: 'info'
  });

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Fetch queries
      const queriesResponse = await fetch('/api/training-data?action=queries');
      const queriesData = await queriesResponse.json();

      // Fetch stats
      const statsResponse = await fetch('/api/training-data?action=stats');
      const statsData = await statsResponse.json();

      if (queriesData.success && statsData.success) {
        setQueries(queriesData.data || []);
        setStats(statsData.data || {
          total: 0,
          pending: 0,
          inTraining: 0,
          resolved: 0,
          byService: {},
          byPriority: {}
        });
      } else {
        console.error('Failed to load training data:', queriesData, statsData);
      }
    } catch (error) {
      console.error('Error loading training data:', error);
      // Set empty data as fallback
      setQueries([]);
      setStats({
        total: 0,
        pending: 0,
        inTraining: 0,
        resolved: 0,
        byService: {},
        byPriority: {}
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Enhanced filtering with search
  const filteredQueries = queries.filter(query => {
    const serviceMatch = selectedService === 'all' || query.detectedServiceType === selectedService;
    const priorityMatch = selectedPriority === 'all' || query.priority === selectedPriority;
    const statusMatch = selectedStatus === 'all' || query.status === selectedStatus;
    const searchMatch = searchQuery === '' ||
      query.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.detectedServiceType.toLowerCase().includes(searchQuery.toLowerCase());

    return serviceMatch && priorityMatch && statusMatch && searchMatch;
  });

  // Enhanced action methods with loading states
  const performAction = async (queryId: string, action: string, actionName: string) => {
    setProcessingIds(prev => new Set(prev).add(queryId));

    try {
      const response = await fetch('/api/training-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, queryId })
      });

      if (response.ok) {
        await loadTrainingData(true);
      } else {
        console.error(`Error ${actionName}:`, await response.text());
      }
    } catch (error) {
      console.error(`Error ${actionName}:`, error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(queryId);
        return newSet;
      });
    }
  };

  const markAsInTraining = (queryId: string) => {
    performAction(queryId, 'mark-in-training', 'marking as in training');
  };

  const markAsResolved = (queryId: string) => {
    performAction(queryId, 'mark-resolved', 'marking as resolved');
  };

  const undoResolved = (queryId: string) => {
    const query = queries.find(q => q.id === queryId);
    setConfirmDialog({
      isOpen: true,
      title: 'Undo Resolved Status',
      message: `Are you sure you want to revert "${query?.query}" back to pending status? This will mark it as needing training again.`,
      type: 'warning',
      onConfirm: () => {
        performAction(queryId, 'undo-resolved', 'undoing resolved status');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Enhanced utility functions with dark mode support
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      case 'medium': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 border-green-200 dark:border-green-800';
      default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
      case 'in_training': return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
      case 'resolved': return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 border-green-200 dark:border-green-800';
      default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_training': return <Play className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatServiceName = (service: string) => {
    return service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Confirmation Dialog Component
  const ConfirmationDialog = () => {
    if (!confirmDialog.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {confirmDialog.type === 'danger' && <AlertCircle className="w-6 h-6 text-red-500" />}
              {confirmDialog.type === 'warning' && <AlertCircle className="w-6 h-6 text-yellow-500" />}
              {confirmDialog.type === 'info' && <AlertCircle className="w-6 h-6 text-blue-500" />}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : confirmDialog.type === 'warning'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <div className="text-gray-600 dark:text-gray-400 font-medium">Loading training data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <ConfirmationDialog />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  SELLY Training Data Manager
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Manage unanswered queries and training priorities for SELLY improvement
              </p>
            </div>
            <button
              onClick={() => loadTrainingData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.total || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Queries</div>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Database className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats?.pending || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pending Training</div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.inTraining || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">In Training</div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.resolved || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Resolved</div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Service Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Queries by Service Type</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats?.byService || {}).map(([service, count]) => (
              <div key={service} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{count}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium capitalize mt-1">
                  {formatServiceName(service)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters & Search</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Queries</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by query text or service type..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Service Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="all">All Services</option>
                {Object.keys(stats?.byService || {}).map(service => (
                  <option key={service} value={service}>
                    {formatServiceName(service)}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'in_training', 'resolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {status === 'all' ? 'All Status' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(selectedService !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-2">
                {selectedService !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                    Service: {formatServiceName(selectedService)}
                  </span>
                )}
                {selectedPriority !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                    Priority: {selectedPriority}
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                    Status: {selectedStatus.replace('_', ' ')}
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                    Search: &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Queries List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Training Queries ({filteredQueries.length})
                </h3>
              </div>
              {filteredQueries.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredQueries.length} of {queries.length} queries
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredQueries.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-medium mb-2">No queries found</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  Try adjusting your filters or search terms
                </div>
              </div>
            ) : (
              filteredQueries.map((query) => (
                <div key={query.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Status and Priority Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getPriorityColor(query.priority)}`}>
                          {getPriorityIcon(query.priority)}
                          {query.priority.toUpperCase()}
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(query.status)}`}>
                          {getStatusIcon(query.status)}
                          {query.status.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                          <Calendar className="w-3 h-3" />
                          {new Date(query.timestamp).toLocaleString()}
                        </div>
                      </div>

                      {/* User Query */}
                      <div className="mb-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">User Query:</div>
                        <div className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-sm leading-relaxed border border-gray-200 dark:border-gray-600">
                          &ldquo;{query.query}&rdquo;
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-gray-100">Service</div>
                          <div className="text-gray-600 dark:text-gray-400 mt-1">{formatServiceName(query.detectedServiceType)}</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-gray-100">Category</div>
                          <div className="text-gray-600 dark:text-gray-400 mt-1">{formatServiceName(query.metadata?.category || 'Unknown')}</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-gray-100">Complexity</div>
                          <div className="text-gray-600 dark:text-gray-400 mt-1 capitalize">{query.metadata?.complexity || 'Unknown'}</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-gray-100">Confidence</div>
                          <div className="text-gray-600 dark:text-gray-400 mt-1">{((query.metadata?.confidence || 0) * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      {/* Tags */}
                      {query.metadata?.tags && query.metadata.tags.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Tags:</div>
                          <div className="flex flex-wrap gap-2">
                            {query.metadata?.tags?.map((tag: string) => (
                              <span key={tag} className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                      {query.status === 'pending' && (
                        <button
                          onClick={() => markAsInTraining(query.id)}
                          disabled={processingIds.has(query.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 min-w-[140px] justify-center"
                        >
                          {processingIds.has(query.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          {processingIds.has(query.id) ? 'Processing...' : 'Start Training'}
                        </button>
                      )}

                      {query.status === 'in_training' && (
                        <button
                          onClick={() => markAsResolved(query.id)}
                          disabled={processingIds.has(query.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 min-w-[140px] justify-center"
                        >
                          {processingIds.has(query.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          {processingIds.has(query.id) ? 'Processing...' : 'Mark Resolved'}
                        </button>
                      )}

                      {query.status === 'resolved' && (
                        <button
                          onClick={() => undoResolved(query.id)}
                          disabled={processingIds.has(query.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 min-w-[140px] justify-center"
                        >
                          {processingIds.has(query.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Undo2 className="w-4 h-4" />
                          )}
                          {processingIds.has(query.id) ? 'Processing...' : 'Undo Resolved'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
