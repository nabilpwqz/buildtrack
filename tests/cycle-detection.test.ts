import { describe, it, expect } from "vitest";
import { hasCircularDependency } from "@/lib/business-rules";

describe("Task Dependency Cycle Detection", () => {
  it("detects immediate self-dependency (A -> A)", () => {
    expect(hasCircularDependency("task-A", "task-A", [])).toBe(true);
  });

  it("detects two-node mutual dependency cycle (A -> B, adding B -> A)", () => {
    const existing = [{ taskId: "task-A", dependsOnId: "task-B" }];
    expect(hasCircularDependency("task-B", "task-A", existing)).toBe(true);
  });

  it("detects multi-node cyclic graph (A -> B -> C -> D, adding D -> A)", () => {
    const existing = [
      { taskId: "task-A", dependsOnId: "task-B" },
      { taskId: "task-B", dependsOnId: "task-C" },
      { taskId: "task-C", dependsOnId: "task-D" },
    ];
    expect(hasCircularDependency("task-D", "task-A", existing)).toBe(true);
  });

  it("allows valid non-cyclic directed acyclic graphs (DAG)", () => {
    const existing = [
      { taskId: "task-A", dependsOnId: "task-B" },
      { taskId: "task-B", dependsOnId: "task-C" },
      { taskId: "task-D", dependsOnId: "task-C" },
    ];
    // Adding task-E -> task-D does not create a cycle
    expect(hasCircularDependency("task-E", "task-D", existing)).toBe(false);
  });
});

