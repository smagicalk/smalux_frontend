import { describe, it, expect } from "vitest";
import { parseProcessMemoryToKb, formatProcessMemory } from "./server-processes-drawer";

describe("Process Memory Unit Parser & Formatter", () => {
  it("parses and formats raw numeric KB correctly", () => {
    expect(formatProcessMemory(820)).toBe("820 KB");
    expect(formatProcessMemory(85000)).toBe("83 MB");
    expect(formatProcessMemory(1450000)).toBe("1.38 GB");
    expect(formatProcessMemory(1048576 * 2.5)).toBe("2.5 GB");
  });

  it("parses string formats like '1 MB', '1.5 GB', '512 KB', '2048 B'", () => {
    expect(formatProcessMemory("1 MB")).toBe("1 MB");
    expect(formatProcessMemory("1.5 GB")).toBe("1.5 GB");
    expect(formatProcessMemory("512 KB")).toBe("512 KB");
    expect(formatProcessMemory("2048 B")).toBe("2 KB");
    expect(formatProcessMemory("1024 MiB")).toBe("1 GB");
    expect(formatProcessMemory("85000")).toBe("83 MB");
  });

  it("handles empty or invalid inputs gracefully", () => {
    expect(formatProcessMemory(undefined)).toBe("—");
    expect(formatProcessMemory(null)).toBe("—");
    expect(formatProcessMemory("")).toBe("—");
    expect(formatProcessMemory("—")).toBe("—");
  });

  it("parses memory into numeric KB accurately for sorting", () => {
    const mem1 = parseProcessMemoryToKb("1.5 GB");
    const mem2 = parseProcessMemoryToKb("85000"); // 85000 KB ~ 83 MB
    const mem3 = parseProcessMemoryToKb("1 MB");   // 1024 KB
    const mem4 = parseProcessMemoryToKb("512 KB"); // 512 KB

    expect(mem1).toBeGreaterThan(mem2);
    expect(mem2).toBeGreaterThan(mem3);
    expect(mem3).toBeGreaterThan(mem4);
  });
});
