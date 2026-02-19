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

export interface FloorPlanFloor {
  level: number;
  name: string;
}

export interface FloorPlan {
  id: number;
  user_id: number;
  name: string;
  width: number;
  height: number;
  floors: FloorPlanFloor[] | null;
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
  floor_level?: number;
  floor_name?: string | null;
  table_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: number;
  customer_name: string;
  customer_email: string;
  arrival_time: string;
  party_size: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  table: {
    id: number;
    name: string;
    floor: string;
  };
  created_at: string;
}

export interface PublicTable {
  id: number;
  name: string;
  floor: string;
  x: number;
  y: number;
  total_seats: number;
  available_seats: number;
  occupied_seats: number;
  is_available: boolean;
  chair_ids: number[];
  reservations: Array<{
    id: number;
    arrival_time: string;
    status: string;
    party_size: number;
  }>;
}

export interface ReservationPayload {
  table_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  arrival_time: string;
  party_size: number;
  notes?: string;
}

export type OccasionType = 'romantic' | 'baby_chair' | 'birthday' | 'quiet' | 'business';

export interface ReservationFormData {
  // Créneau
  date: string;
  time: string;
  partySize: number;
  
  // Placement
  placementMode: 'auto' | 'manual';
  selectedTableId: number | null;
  
  // Client
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Spécial
  occasion?: OccasionType[];
  specialNotes?: string;
}

export interface MenuItem {
  id: number;
  user_id: number;
  name: string;
  ingredients: string | null;
  price: number;
  is_halal: boolean;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemPayload {
  name: string;
  ingredients?: string;
  price: number;
  is_halal?: boolean;
  image_url?: string;
  category?: string;
  is_available?: boolean;
  order?: number;
}
