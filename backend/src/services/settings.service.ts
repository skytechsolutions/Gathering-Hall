import { prisma } from "../config/prisma.js";

export class SettingsService {
  async getCommission() {
    let setting = await prisma.commissionSetting.findFirst();
    if (!setting) {
      setting = await prisma.commissionSetting.create({
        data: { rate: 5.0 },
      });
    }
    return {
      rate: Number(setting.rate),
      updatedAt: setting.updatedAt,
    };
  }

  async updateCommission(rate: number, adminId: string) {
    let setting = await prisma.commissionSetting.findFirst();
    if (!setting) {
      setting = await prisma.commissionSetting.create({
        data: { rate, updatedBy: adminId },
      });
    } else {
      setting = await prisma.commissionSetting.update({
        where: { id: setting.id },
        data: { rate, updatedBy: adminId },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "COMMISSION_RATE_UPDATED",
        details: { newRate: rate },
      },
    });

    return {
      rate: Number(setting.rate),
      updatedAt: setting.updatedAt,
    };
  }
}

export const settingsService = new SettingsService();
