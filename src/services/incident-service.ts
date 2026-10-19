import prisma from "@/lib/database/prisma";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export interface UpdateIncidentInput {
  incidentId: string;
  userId: string;
  status?: "OPEN" | "INVESTIGATING" | "CONTAINED" | "RECOVERING" | "RESOLVED" | "FALSE_POSITIVE";
  notes?: string;
}

export class IncidentService {
  static async listIncidents(userIdOrOptions: string | { userId: string; status?: string }, statusParam?: string) {
    const userId = typeof userIdOrOptions === "string" ? userIdOrOptions : userIdOrOptions.userId;
    const status = typeof userIdOrOptions === "string" ? statusParam : (userIdOrOptions.status || statusParam);

    const where: any = { userId };
    if (status && status !== "ALL") {
      where.status = status;
    }

    return await prisma.securityIncident.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  static async getIncidentById(incidentId: string, userId: string) {
    const incident = await prisma.securityIncident.findFirst({
      where: { id: incidentId, userId },
    });
    if (!incident) throw new Error("Incident not found.");
    return incident;
  }

  static async updateIncident(input: UpdateIncidentInput) {
    const existing = await prisma.securityIncident.findFirst({
      where: { id: input.incidentId, userId: input.userId },
    });
    if (!existing) throw new Error("Incident not found.");

    const updateData: any = {};
    if (input.status) {
      updateData.status = input.status;
      if (input.status === "RESOLVED" || input.status === "FALSE_POSITIVE") {
        updateData.resolvedAt = new Date();
      }
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    const updated = await prisma.securityIncident.update({
      where: { id: input.incidentId },
      data: updateData,
    });

    await logAuditEvent({
      eventType: "INCIDENT_UPDATE",
      actorId: input.userId,
      resourceType: "INCIDENT",
      resourceId: input.incidentId,
      outcome: "SUCCESS",
      details: {
        previousStatus: existing.status,
        newStatus: input.status || existing.status,
        incidentNumber: existing.incidentNumber,
      },
    });

    return updated;
  }

  static async updateIncidentStatus(input: UpdateIncidentInput) {
    return this.updateIncident(input);
  }
}
