export type BookingStatus = "HOLD" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
export type BookingShift = "DAY" | "NIGHT";

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  booking_date: string;
  day_name: string;
  shift: BookingShift;
  event_type: string | null;
  status: BookingStatus;
  guest_count: number;
  male_waiter_required: boolean;
  male_waiter_quantity: number;
  female_waiter_required: boolean;
  female_waiter_quantity: number;
  dj_required: boolean;
  stage_required: boolean;
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  remaining_amount: number;
  created_by: string | null;
  confirmed_by: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  customer?: {
    id?: string;
    full_name: string;
    phone: string | null;
  };
}

export interface NewBookingInput {
  customerId?: string;
  newCustomerName?: string;
  newCustomerPhone?: string;
  bookingDate: string;
  shift: BookingShift;
  eventType?: string | null;
  status?: BookingStatus;
  guestCount?: number;
  maleWaiterRequired?: boolean;
  maleWaiterQuantity?: number;
  femaleWaiterRequired?: boolean;
  femaleWaiterQuantity?: number;
  djRequired?: boolean;
  stageRequired?: boolean;
  totalAmount?: number;
  advanceAmount?: number;
  notes?: string | null;
}
