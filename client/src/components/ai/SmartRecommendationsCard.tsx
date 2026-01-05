import React, { useEffect, useState } from 'react';
import { aiService, SmartRecommendations } from '../../services/aiService';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { FiZap, FiCheck } from 'react-icons/fi';

const SmartRecommendationsCard: React.FC = () => {
  const [recommendations, setRecommendations] = useState<SmartRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await aiService.getPersonalizedRecommendations();
        if (response.success && response.data) {
          setRecommendations(response.data);
        }
      } catch (err: any) {
        // Silently fail - recommendations are optional
        console.log('Recommendations not available:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <Card title="Smart Recommendations">
        <div className="flex justify-center py-4">
          <Loading />
        </div>
      </Card>
    );
  }

  if (error || !recommendations || recommendations.recommendations.length === 0) {
    return null; // Don't show if no recommendations
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FiZap className="text-yellow-500 w-5 h-5" />
        <h3 className="text-lg font-semibold text-gray-900">
          Personalized Tips for You
        </h3>
      </div>

      <div className="space-y-3">
        {recommendations.recommendations.map((rec, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
          >
            <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end text-xs text-gray-500 mt-3 pt-3 border-t">
        <span className="flex items-center gap-1">
          <FiZap className="w-3 h-3" />
          {recommendations.poweredBy}
        </span>
      </div>
    </Card>
  );
};

export default SmartRecommendationsCard;
