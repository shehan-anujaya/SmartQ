import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { useAppSelector } from '../store/hooks';
import { aiService, PeakHourData } from '../services/aiService';
import { AIAnalytics } from '../components/analytics/AIAnalytics';
import AIInsightsCard from '../components/ai/AIInsightsCard';
import api from '../services/api';
import { generateInsightsPDF } from '../utils/pdfGenerator';
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiActivity,
  FiDownload
} from 'react-icons/fi';

interface AnalyticsData {
  users: {
    total: number;
    customers: number;
    staff: number;
    admins: number;
    activeToday: number;
  };
  queues: {
    total: number;
    waiting: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    avgWaitTime: number;
  };
  appointments: {
    total: number;
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    todayCount: number;
  };
  services: {
    total: number;
    active: number;
    topServices: { name: string; count: number }[];
  };
}

const Analytics: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth); // Auth check for route protection
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHourData[]>([]);
  const [aiInsights, setAIInsights] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [usersRes, queuesRes, appointmentsRes, servicesRes, insightsRes] = await Promise.all([
          api.get('/users/stats/overview'),
          api.get('/queues/stats/overview'),
          api.get('/appointments/stats/overview'),
          api.get('/services?limit=100'),
          aiService.getAIInsights(30)
        ]);

        const peakHoursRes = await aiService.getPeakHours();

        // Extract services array from nested response structure
        const servicesArray = servicesRes.data?.data?.services || servicesRes.data?.data || [];
        setServices(servicesArray.filter((s: any) => s.status === 'active'));

        setAnalytics({
          users: usersRes.data.data || {
            total: 0,
            customers: 0,
            staff: 0,
            admins: 0,
            activeToday: 0
          },
          queues: queuesRes.data.data || {
            total: 0,
            waiting: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            avgWaitTime: 0
          },
          appointments: appointmentsRes.data.data || {
            total: 0,
            scheduled: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            todayCount: 0
          },
          services: {
            total: Array.isArray(servicesArray) ? servicesArray.length : 0,
            active: Array.isArray(servicesArray) ? servicesArray.filter((s: any) => s.status === 'active').length : 0,
            topServices: []
          }
        });

        if (peakHoursRes.success && peakHoursRes.data) {
          // Extract predictions array from the response
          const predictionsData = peakHoursRes.data.predictions || peakHoursRes.data;
          setPeakHours(Array.isArray(predictionsData) ? predictionsData : []);
        }

        if (insightsRes.success && insightsRes.data) {
          setAIInsights(insightsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  const handleDownloadPDF = async () => {
    if (!analytics || generatingPDF) return;

    setGeneratingPDF(true);
    try {
      const dashboardStats = {
        appointments: {
          total: analytics.appointments.total,
          today: analytics.appointments.todayCount,
          pending: analytics.appointments.scheduled,
          completed: analytics.appointments.completed,
        },
        queue: {
          total: analytics.queues.total,
          waiting: analytics.queues.waiting,
          serving: analytics.queues.inProgress,
          avgWaitTime: analytics.queues.avgWaitTime,
        },
        users: {
          total: analytics.users.total,
          active: analytics.users.activeToday,
          newThisMonth: analytics.users.customers,
        },
        services: {
          total: analytics.services.total,
          active: analytics.services.active,
        },
      };

      const insights = {
        summary: aiInsights?.summary || 'AI insights are currently being generated...',
        recommendations: aiInsights?.recommendations || [
          'Continue monitoring system performance',
          'Review peak hours data for staffing optimization',
        ],
      };

      await generateInsightsPDF(
        dashboardStats,
        insights,
        services,
        user?.name || 'Admin'
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: analytics?.users.total || 0,
      subtitle: `${analytics?.users.customers || 0} customers`,
      icon: FiUsers,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Queues',
      value: (analytics?.queues.waiting || 0) + (analytics?.queues.inProgress || 0),
      subtitle: `${analytics?.queues.waiting || 0} waiting`,
      icon: FiClock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Today\'s Appointments',
      value: analytics?.appointments.todayCount || 0,
      subtitle: `${analytics?.appointments.scheduled || 0} scheduled`,
      icon: FiCalendar,
      color: 'bg-green-500'
    },
    {
      title: 'Completed Today',
      value: analytics?.queues.completed || 0,
      subtitle: 'Services completed',
      icon: FiCheckCircle,
      color: 'bg-purple-500'
    }
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Download Button */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of your business performance and insights
            </p>
          </div>
          <Button
            onClick={handleDownloadPDF}
            disabled={generatingPDF || !analytics}
            className="flex items-center gap-2"
          >
            <FiDownload />
            {generatingPDF ? 'Generating...' : 'Download PDF Report'}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* AI Insights Card */}
        <AIInsightsCard />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue Status */}
          <Card title="Queue Status Overview">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiClock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Waiting</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {analytics?.queues.waiting || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiActivity className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">In Progress</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {analytics?.queues.inProgress || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiCheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Completed</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {analytics?.queues.completed || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiXCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Cancelled</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {analytics?.queues.cancelled || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Appointment Stats */}
          <Card title="Appointment Statistics">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiCalendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Scheduled</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {analytics?.appointments.scheduled || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiCheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Confirmed</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {analytics?.appointments.confirmed || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiTrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Completed</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {analytics?.appointments.completed || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiXCircle className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Cancelled</span>
                </div>
                <span className="text-2xl font-bold text-gray-600">
                  {analytics?.appointments.cancelled || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Peak Hours Insights */}
        <Card title="AI Peak Hours Analysis">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Based on historical data, here are the predicted busy periods:
            </p>
            
            {peakHours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {peakHours.slice(0, 6).map((peak, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      peak.expectedLoad > 75
                        ? 'border-red-200 bg-red-50'
                        : peak.expectedLoad > 50
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {dayNames[peak.dayOfWeek]}
                      </span>
                      <span className="text-sm text-gray-600">
                        {peak.hour}:00
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expected Load</span>
                      <span className={`font-bold ${
                        peak.expectedLoad > 75
                          ? 'text-red-600'
                          : peak.expectedLoad > 50
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {peak.expectedLoad}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{peak.recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiActivity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Not enough data for peak hour predictions yet.</p>
                <p className="text-sm">Analytics will improve as more data is collected.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Service Performance */}
        <Card title="Service Overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <FiActivity className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">
                {analytics?.services.total || 0}
              </p>
              <p className="text-sm text-gray-600">Total Services</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <FiCheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">
                {analytics?.services.active || 0}
              </p>
              <p className="text-sm text-gray-600">Active Services</p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <FiTrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">
                {analytics?.queues.avgWaitTime || 0}
              </p>
              <p className="text-sm text-gray-600">Avg Wait (mins)</p>
            </div>
          </div>
        </Card>

        {/* AI-Powered Analytics Section */}
        <div className="mt-8">
          <AIAnalytics />
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
