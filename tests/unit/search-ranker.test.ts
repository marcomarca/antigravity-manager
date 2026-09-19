import { describe, expect, it } from "bun:test";
import { filterAndRankProjects, rankProject } from "../../src/domain/search-ranker";
import type { Project } from "../../src/domain/types";

describe("Search Ranker", () => {
  const sampleProjects: Project[] = [
    {
      name: "Invoice API",
      path: "C:\\Projects\\Invoice API",
      type: "folder",
      exists: true,
      source: { antigravityRecent: true, projectsRoot: true },
      recentIndex: 0,
      note: "Need client credentials"
    },
    {
      name: "Project Launcher",
      path: "C:\\Projects\\Project Launcher",
      type: "folder",
      exists: true,
      source: { antigravityRecent: true, projectsRoot: false },
      recentIndex: 1
    },
    {
      name: "Website",
      path: "D:\\Clients\\Website",
      type: "folder",
      exists: true,
      source: { antigravityRecent: false, projectsRoot: true },
      note: "Invoice design changes"
    },
    {
      name: "Analytics Service",
      path: "C:\\Projects\\Analytics Service",
      type: "folder",
      exists: true,
      source: { antigravityRecent: false, projectsRoot: true }
    }
  ];

  it("sorts by recentIndex then alphabetical when query is empty", () => {
    const results = filterAndRankProjects(sampleProjects, "");
    expect(results[0]?.name).toBe("Invoice API");
    expect(results[1]?.name).toBe("Project Launcher");
    expect(results[2]?.name).toBe("Analytics Service");
    expect(results[3]?.name).toBe("Website");
  });

  it("prioritizes exact name match over substring or note match", () => {
    const results = filterAndRankProjects(sampleProjects, "Invoice API");
    expect(results[0]?.name).toBe("Invoice API");
  });

  it("matches projects when search term is in project note", () => {
    const results = filterAndRankProjects(sampleProjects, "credentials");
    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("Invoice API");
  });

  it("ranks name prefix matches higher than note matches", () => {
    // Both 'Invoice API' and 'Website' match query 'Invoice' (one in name, one in note)
    const results = filterAndRankProjects(sampleProjects, "Invoice");
    expect(results[0]?.name).toBe("Invoice API");
    expect(results[1]?.name).toBe("Website");
  });

  it("matches and ranks projects when search term is in project description", () => {
    const projectsWithDesc: Project[] = [
      {
        name: "Dashboard",
        path: "C:\\Projects\\Dashboard",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        description: "Billing overview and metrics engine"
      },
      {
        name: "Backend Auth",
        path: "C:\\Projects\\Backend Auth",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        note: "Check billing keys"
      }
    ];

    const results = filterAndRankProjects(projectsWithDesc, "metrics");
    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("Dashboard");

    // Description ranks higher than note for identical query
    const resultsBilling = filterAndRankProjects(projectsWithDesc, "billing");
    expect(resultsBilling[0]?.name).toBe("Dashboard");
    expect(resultsBilling[1]?.name).toBe("Backend Auth");
  });
});
