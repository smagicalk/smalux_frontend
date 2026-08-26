import { describe, it, expect } from "vitest";
import { settingsMockEngine } from "../mock/settings-mock";

describe("Settings & Security Mock Engine API suite", () => {
  it("should retrieve and update storage stats correctly", () => {
    const stats = settingsMockEngine.getStorageStats();
    expect(stats.dbSizeMb).toBeGreaterThan(0);
    expect(stats.metricsSizeMb).toBeGreaterThan(0);

    const cleanRes = settingsMockEngine.cleanData("metrics", "30");
    expect(cleanRes.ok).toBe(true);
    expect(cleanRes.freedMb).toBeGreaterThan(0);
  });

  it("should perform backup plans lifecycle (create, toggle, run, delete)", () => {
    const initialPlans = settingsMockEngine.getBackupPlans().plans;
    const count = initialPlans.length;

    // Create
    const created = settingsMockEngine.createBackupPlan({
      name: "测试快照计划",
      enabled: true,
      timeType: "fixed",
      fixedMode: "daily",
      fixedTime: "02:00",
      cronExpr: "0 2 * * *",
      retentionCount: 7,
      enableRemote: false,
      scope: "all",
      encrypt: true
    });
    expect(created.id).toBeDefined();
    expect(created.name).toBe("测试快照计划");

    // Toggle
    const toggleRes = settingsMockEngine.toggleBackupPlan(created.id, false);
    expect(toggleRes.ok).toBe(true);

    // Run
    const runRes = settingsMockEngine.runBackupPlan(created.id);
    expect(runRes.ok).toBe(true);
    expect(runRes.backup).toBeDefined();

    // Delete
    const delRes = settingsMockEngine.deleteBackupPlan(created.id);
    expect(delRes.ok).toBe(true);
    expect(settingsMockEngine.getBackupPlans().plans.length).toBe(count);
  });

  it("should perform backup snapshot lifecycle (create, restore, prune, delete)", () => {
    // Create manual backup
    const backup = settingsMockEngine.createBackup({
      scope: "all",
      encrypt: true,
      notes: "单元测试手动备份"
    });
    expect(backup.id).toBeDefined();

    // Restore
    const restoreRes = settingsMockEngine.restoreBackup(backup.id, "some-key");
    expect(restoreRes.ok).toBe(true);

    // Delete
    const delRes = settingsMockEngine.deleteBackup(backup.id);
    expect(delRes.ok).toBe(true);

    // Prune
    const pruneRes = settingsMockEngine.pruneBackups("older_30d");
    expect(pruneRes.ok).toBe(true);
  });

  it("should handle security MFA, password and sessions correctly", () => {
    const overview = settingsMockEngine.getSecurityOverview();
    expect(overview.securityScore).toBeGreaterThan(0);

    // Setup TOTP
    const totpSetup = settingsMockEngine.setupTotp();
    expect(totpSetup.secret).toBeDefined();
    expect(totpSetup.otpauthUrl).toContain("otpauth://");

    // Verify TOTP
    const verifyRes = settingsMockEngine.verifyTotp("123456");
    expect(verifyRes.ok).toBe(true);

    // Disable TOTP
    const disableRes = settingsMockEngine.disableTotp("admin_pwd");
    expect(disableRes.ok).toBe(true);

    // Sessions
    const sessions = settingsMockEngine.getSessions().sessions;
    expect(sessions.length).toBeGreaterThan(0);
    const terminateOthersRes = settingsMockEngine.logoutOtherSessions();
    expect(terminateOthersRes.ok).toBe(true);
  });
});
