import api from './api';

// ============================================
// AI Summary API (từ A9 SOC Copilot)
// ============================================
export const getAISummary = async () => {
  const res = await api.get('/dashboard/ai-summary');
  return res.data;
};

export interface AISummary {
  id: number;
  time_window: string;
  summary: string;
  top_threat: {
    ip: string;
    type: string;
    severity: string;
    description: string;
  };
  affected_targets: string[];
  recommendation: string;
  risk_level: string;
  alert_count: number;
  threats_count: number;
  investigations_count: number;
  created_at: string;
}
