import React, { useEffect, useState } from 'react';
import { aiService, OptimalSlot } from '../../services/aiService';
import { FiClock, FiStar, FiCheckCircle } from 'react-icons/fi';
import Loading from '../common/Loading';

interface AIBookingSuggestionsProps {
  serviceId: string;
  selectedDate: string;
  onSelectSlot: (time: string) => void;
}

const AIBookingSuggestions: React.FC<AIBookingSuggestionsProps> = ({
  serviceId,
  selectedDate,
  onSelectSlot
}) => {
  const [slots, setSlots] = useState<OptimalSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!serviceId || !selectedDate) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await aiService.getOptimalSlots(serviceId, selectedDate);
        if (response.success && response.data) {
          setSlots(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch AI suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [serviceId, selectedDate]);

  if (!serviceId || !selectedDate) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <FiStar className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-900">AI Suggestions</span>
        </div>
        <Loading />
      </div>
    );
  }

  if (error || slots.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
      <div className="flex items-center space-x-2 mb-3">
        <FiStar className="h-5 w-5 text-purple-600" />
        <span className="font-semibold text-purple-900">AI-Recommended Time Slots</span>
      </div>
      
      <p className="text-sm text-purple-700 mb-4">
        Based on historical data, these times have shorter wait times and better availability:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {slots.slice(0, 6).map((slot, index) => (
          <button
            key={index}
            onClick={() => onSelectSlot(slot.time)}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3">
              <FiClock className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">{slot.time}</p>
                <p className="text-xs text-gray-500">{slot.reason}</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(slot.score)}`}>
              {slot.score}%
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIBookingSuggestions;
