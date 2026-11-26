export interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  reference_name: string | null;
  reference_phone: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface NewCustomerInput {
  fullName: string;
  phone?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  referenceName?: string | null;
  referencePhone?: string | null;
  notes?: string | null;
}
