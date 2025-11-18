import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { api } from '@/api';

interface Insight {
  insights: string;
  suggestions: string[];
  flags: string[];
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
}

export default function AIInsights() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getInsights();
      setInsight(data);
    } catch (err: any) {
      // 404 is expected if no insights yet
      if (!err.message?.includes('404') && !err.message?.includes('No insights')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setGenerating(true);
      setError('');

      // Calculate date range (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const result = await api.requestInsights(startDate, endDate);

      if (result.status === 'cached') {
        // Insights already exist, reload
        await loadInsights();
        setGenerating(false);
      } else {
        // Poll for completion
        pollForInsights();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights');
      setGenerating(false);
    }
  };

  const pollForInsights = () => {
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts × 3s = 60s max

    const interval = setInterval(async () => {
      attempts++;

      try {
        const data = await api.getInsights();
        if (data) {
          setInsight(data);
          clearInterval(interval);
          setGenerating(false);
        }
      } catch (err) {
        // Continue polling on 404
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setGenerating(false);
        setError('Insight generation timed out. Please try again.');
      }
    }, 3000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">AI Financial Insights</h3>
        </div>
        <button
          onClick={generateInsights}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate Insights'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {generating && !insight && (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Analyzing your spending patterns...</p>
          <p className="text-sm text-gray-500 mt-2">This may take 10-30 seconds</p>
        </div>
      )}

      {insight ? (
        <div className="space-y-4">
          {/* Main Insights */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 leading-relaxed">{insight.insights}</p>
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
              Generated {new Date(insight.generatedAt).toLocaleString()} • 
              Period: {new Date(insight.period.start).toLocaleDateString()} - {new Date(insight.period.end).toLocaleDateString()}
            </p>
          </div>

          {/* Suggestions */}
          {insight.suggestions.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Recommendations</h4>
              </div>
              <ul className="space-y-2">
                {insight.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5 font-bold">•</span>
                    <span className="text-gray-700 text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flags/Warnings */}
          {insight.flags.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-gray-900">Alerts</h4>
              </div>
              <ul className="space-y-2">
                {insight.flags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">⚠</span>
                    <span className="text-gray-700 text-sm font-medium">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        !generating && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No insights yet</p>
            <p className="text-sm mt-1">Click "Generate Insights" to get personalized financial advice based on your spending patterns.</p>
          </div>
        )
      )}
    </div>
  );
}
