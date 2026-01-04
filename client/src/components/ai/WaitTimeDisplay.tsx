import React, { useEffect, useState } from 'react';
import { aiService, WaitTimeEstimate } from '../../services/aiService';
import { FiClock, FiUsers, FiTrendingUp } from 'react-icons/fi';

interface WaitTimeDisplayProps {
  serviceId: string;
  className?: string;
}

const WaitTimeDisplay: React.FC<WaitTimeDisplayProps> = ({ serviceId, className = '' }) => {
  const [estimate, setEstimate] = useState<WaitTimeEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!serviceId) return;
      
      setLoading(true);
      try {
        const response = await aiService.getWaitTimeEstimate(serviceId);
        if (response.success && response.data) {
          setEstimate(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch wait time:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchEstimate, 30000);
    return () => clearInterval(interval);
  }, [serviceId]);

  if (loading || !estimate) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const getWaitColor = (minutes: number) => {
    if (minutes <= 10) return 'text-green-600';
    if (minutes <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High confidence';
    if (confidence >= 50) return 'Medium confidence';
    return 'Estimated';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 flex items-center">
            <FiClock className="mr-1" />
            Estimated Wait Time
          </p>
          <p className={`text-2xl font-bold ${getWaitColor(estimate.estimatedWaitMinutes)}`}>
            {estimate.estimatedWaitMinutes} min
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 flex items-center justify-end">
            <FiUsers className="mr-1" />
            Queue Position
          </p>
          <p className="text-2xl font-bold text-gray-900">
            #{estimate.queuePosition}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center text-xs text-gray-500">
        <FiTrendingUp className="mr-1" />
        {getConfidenceLabel(estimate.confidence)} ({estimate.confidence}%)
      </div>
    </div>
  );
};

export default WaitTimeDisplay;
