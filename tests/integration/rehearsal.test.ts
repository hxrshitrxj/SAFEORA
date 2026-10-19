import { describe, it, expect, beforeAll } from "vitest";
import prisma from "@/lib/database/prisma";
import { RehearsalService } from "@/services/rehearsal-service";

describe("Breach Rehearsal & Recovery Proof Suite (Integration)", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Find or create test user
    const user = await prisma.user.findFirst();
    if (user) {
      testUserId = user.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email: "integration-tester@phoenix.local",
          name: "Integration Tester",
          passwordHash: "test_hash",
        },
      });
      testUserId = created.id;
    }
  });

  it("executes all 5 rehearsal scenarios and persists results with 100% pass", async () => {
    const runId = await RehearsalService.runFullRehearsal(testUserId);
    expect(runId).toBeDefined();

    const run = await prisma.rehearsalRun.findUnique({
      where: { id: runId },
      include: { scenarios: true },
    });

    expect(run).toBeDefined();
    expect(run?.status).toBe("COMPLETED");
    expect(run?.totalScenarios).toBe(5);
    expect(run?.passedScenarios).toBe(5);
    expect(run?.failedScenarios).toBe(0);
    expect(run?.scenarios.length).toBe(5);

    // Verify Scenario A: Document Tampering
    const scenarioA = run?.scenarios.find((s) => s.scenarioKey === "SCENARIO_A_DOC_TAMPER");
    expect(scenarioA?.passed).toBe(true);
    expect(scenarioA?.detectionStatus).toBe("DETECTED");

    // Verify Scenario B: Manifest Tampering
    const scenarioB = run?.scenarios.find((s) => s.scenarioKey === "SCENARIO_B_MANIFEST_TAMPER");
    expect(scenarioB?.passed).toBe(true);
    expect(scenarioB?.detectionStatus).toBe("DETECTED");

    // Verify Scenario C: Unauthorized Session
    const scenarioC = run?.scenarios.find((s) => s.scenarioKey === "SCENARIO_C_UNAUTHORIZED_SESSION");
    expect(scenarioC?.passed).toBe(true);
    expect(scenarioC?.containmentStatus).toBe("CONTAINED");

    // Verify Scenario D: Recovery Proof
    const scenarioD = run?.scenarios.find((s) => s.scenarioKey === "SCENARIO_D_RECOVERY_PROOF");
    expect(scenarioD?.passed).toBe(true);
    expect(scenarioD?.recoveryStatus).toBe("RECOVERED");

    // Verify Scenario E: Bulk Activity
    const scenarioE = run?.scenarios.find((s) => s.scenarioKey === "SCENARIO_E_BULK_ACTIVITY");
    expect(scenarioE?.passed).toBe(true);
    expect(scenarioE?.containmentStatus).toBe("CONTAINED");

    // Verify report generation
    const report = await RehearsalService.generateReport(runId, testUserId);
    expect(report.markdown).toContain("Breach Rehearsal & Recovery Proof Report");
    expect(report.markdown).toContain("Scenario A: Document Ciphertext Tampering");
  }, 15000);
});
