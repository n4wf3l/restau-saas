export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface FloorPlan {
  id: number;
  user_id: number;
  name: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
  items: FloorPlanItem[];
}

export interface FloorPlanItem {
  id: number;
  floor_plan_id: number;
  type: "table" | "chair" | "wall" | "empty";
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  meta: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
