import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Student = {
  id: string;
  name: string;
  category: 'School' | 'Dars';
  class: string;
  username: string;
  password: string;
  parent_user: string;
  parent_pass: string;
  fees_paid: boolean;
  custom_id: string | null;
  photo_url: string | null;
  father_whatsapp: string | null;
  mother_whatsapp: string | null;
  created_at: string;
};

export type CallLog = {
  id: string;
  student_id: string;
  called_at: string;
  created_at: string;
};

export type Note = {
  id: string;
  class: string;
  subject: string;
  title: string;
  link: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  approved: boolean;
  created_at: string;
};

export type FeePayment = {
  id: string;
  student_id: string;
  year: number;
  month: number;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  receipt_id: string | null;
  created_at: string;
};

export type Leave = {
  id: string;
  student_id: string;
  leave_type: 'School' | 'Dars';
  reason: string;
  departure_date: string;
  departure_time: string;
  return_date: string;
  return_time: string;
  total_days: number;
  status: 'approved' | 'pending' | 'rejected';
  requested_by: string | null;
  created_at: string;
};

export type MonthlyLeave = {
  id: string;
  year: number;
  month: number;
  leave_type: 'School' | 'Dars';
  title: string;
  start_date: string;
  end_date: string;
  total_days: number;
  created_at: string;
};

export type LeaveBalance = {
  id: string;
  student_id: string;
  year: number;
  month: number;
  leave_type: 'School' | 'Dars';
  allocated_days: number;
  used_days: number;
  extra_days: number;
  held_days: number;
  carry_forward: number;
  created_at: string;
};

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  sort_order: number;
  created_at: string;
};

export type LeaveNonGoer = {
  id: string;
  monthly_leave_id: string;
  student_id: string;
  notes: string | null;
  created_at: string;
};

export type Staff = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'staff';
  permissions: string[];
  created_at: string;
};

export type Mark = {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  exam_type: 'School' | 'Dars' | null;
  exam_name: string | null;
  total_marks: number | null;
  created_at: string;
};

export type ExamConfig = {
  id: string;
  name: string;
  total_marks: number;
  remarks: string | null;
  created_at: string;
};
