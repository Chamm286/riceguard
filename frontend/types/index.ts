export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "analyst" | "viewer";
  telegram_chat_id?: string;
}

export interface Alert {
  id: number;
  feature_id: number;
  field_id: number;
  field_name?: string;
  alert_type: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  predicted_at: string;
  lead_time_minutes: number;
  status: "new" | "processing" | "resolved" | "ignored";
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: number;
  source: string;
  event_type: string;
  severity: string;
  ip_address: string;
  username?: string;
  field_name?: string;
  message: string;
  created_at: string;
}

export interface Field {
  id: number;
  name: string;
  location: string;
  area_hectare: number;
  owner_name?: string;
  active_alerts?: number;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  totalAlerts: number;
  newAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  totalLogs: number;
  totalFields: number;
}
