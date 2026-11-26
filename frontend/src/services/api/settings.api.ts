import api from "./axios";

export interface CommissionSetting {
  id: string;
  percentage: number;
  updatedBy: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const settingsApi = {
  async getCommission() {
    return api.get<{ commission: CommissionSetting }>("/settings/commission");
  },

  async updateCommission(percentage: number, notes?: string) {
    return api.put<{ commission: CommissionSetting; message: string }>("/settings/commission", {
      percentage,
      notes,
    });
  },
};
