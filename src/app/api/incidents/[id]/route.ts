import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { IncidentService } from "@/services/incident-service";
import { UpdateIncidentSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const incident = await IncidentService.getIncidentById(params.id, auth.user.id);
    return NextResponse.json(incident);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Incident not found" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = UpdateIncidentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updated = await IncidentService.updateIncident({
      incidentId: params.id,
      userId: auth.user.id,
      status: parsed.data.status,
      notes: parsed.data.notes,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update incident" }, { status: 400 });
  }
}
