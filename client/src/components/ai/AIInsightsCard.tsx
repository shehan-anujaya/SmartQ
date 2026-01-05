import React, { useEffect, useState } from 'react';
import { aiService, AIInsights } from '../../services/aiService';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { FiZap, FiRefreshCw } from 'react-icons/fi';

interface AIInsightsCardProps {
  days?: number;
}

const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ days = 30 }) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiService.getAIInsights(days);
      if (response.success && response.data) {
        setInsights(response.data);
      } else {
        setError('Failed to load AI insights');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [days]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiZap className="text-purple-600 w-6 h-6" />
          <h3 className="text-xl font-semibold text-gray-900">
            AI-Powered Insights
          </h3>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && !insights ? (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          {error.includes('not configured') && (
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
            >
              Get FREE Gemini API Key →
            </a>
          )}
        </div>
      ) : insights ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {insights.insights}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-4">
              <span>Analyzed {insights.analyzedDays} days of data</span>
              <span className="flex items-center gap-1">
                <FiZap className="w-3 h-3 text-purple-600" />
                Powered by {insights.poweredBy}
              </span>
            </div>
            <span>
              Generated {new Date(insights.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
};

export default AIInsightsCard;
