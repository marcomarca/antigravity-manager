import { describe, expect, it } from "bun:test";
import { filterAndRankProjects, getUniqueTagsWithCounts, rankProject } from "../../src/domain/search-ranker";
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

  describe("Sort Modes", () => {
    const timedProjects: Project[] = [
      {
        name: "Charlie App",
        path: "C:\\Projects\\Charlie App",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        createdAt: 1000,
        modifiedAt: 5000
      },
      {
        name: "Alpha App",
        path: "C:\\Projects\\Alpha App",
        type: "folder",
        exists: true,
        source: { antigravityRecent: true, projectsRoot: true },
        recentIndex: 1,
        createdAt: 3000,
        modifiedAt: 2000
      },
      {
        name: "Bravo App",
        path: "C:\\Projects\\Bravo App",
        type: "folder",
        exists: true,
        source: { antigravityRecent: true, projectsRoot: true },
        recentIndex: 0,
        createdAt: 2000,
        modifiedAt: 4000
      },
      {
        name: "Delta App",
        path: "C:\\Projects\\Delta App",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        createdAt: 4000,
        modifiedAt: 1000
      }
    ];

    it("sorts by 'recent': recentIndex first, then modifiedAt", () => {
      const sorted = filterAndRankProjects(timedProjects, "", "recent");
      expect(sorted.map((p) => p.name)).toEqual([
        "Bravo App",   // recentIndex: 0
        "Alpha App",   // recentIndex: 1
        "Charlie App", // modifiedAt: 5000
        "Delta App"    // modifiedAt: 1000
      ]);
    });

    it("sorts by 'name_asc': strictly alphabetical A to Z", () => {
      const sorted = filterAndRankProjects(timedProjects, "", "name_asc");
      expect(sorted.map((p) => p.name)).toEqual([
        "Alpha App",
        "Bravo App",
        "Charlie App",
        "Delta App"
      ]);
    });

    it("sorts by 'name_desc': strictly alphabetical Z to A", () => {
      const sorted = filterAndRankProjects(timedProjects, "", "name_desc");
      expect(sorted.map((p) => p.name)).toEqual([
        "Delta App",
        "Charlie App",
        "Bravo App",
        "Alpha App"
      ]);
    });

    it("sorts by 'created_desc': newest created first", () => {
      const sorted = filterAndRankProjects(timedProjects, "", "created_desc");
      expect(sorted.map((p) => p.name)).toEqual([
        "Delta App",   // createdAt: 4000
        "Alpha App",   // createdAt: 3000
        "Bravo App",   // createdAt: 2000
        "Charlie App"  // createdAt: 1000
      ]);
    });

    it("sorts by 'created_asc': oldest created first", () => {
      const sorted = filterAndRankProjects(timedProjects, "", "created_asc");
      expect(sorted.map((p) => p.name)).toEqual([
        "Charlie App", // createdAt: 1000
        "Bravo App",   // createdAt: 2000
        "Alpha App",   // createdAt: 3000
        "Delta App"    // createdAt: 4000
      ]);
    });

    it("sorts by 'modified_desc': most recently modified first", () => {
      const sorted = filterAndRankProjects(timedProjects, "", "modified_desc");
      expect(sorted.map((p) => p.name)).toEqual([
        "Charlie App", // modifiedAt: 5000
        "Bravo App",   // modifiedAt: 4000
        "Alpha App",   // modifiedAt: 2000
        "Delta App"    // modifiedAt: 1000
      ]);
    });

    it("applies sortMode as tie-breaker for identical search match scores", () => {
      const tieProjects: Project[] = [
        {
          name: "Project D",
          path: "C:\\Projects\\Project D",
          type: "folder",
          exists: true,
          source: { antigravityRecent: false, projectsRoot: true },
          createdAt: 4000
        },
        {
          name: "Project B",
          path: "C:\\Projects\\Project B",
          type: "folder",
          exists: true,
          source: { antigravityRecent: false, projectsRoot: true },
          createdAt: 2000
        },
        {
          name: "Project A",
          path: "C:\\Projects\\Project A",
          type: "folder",
          exists: true,
          source: { antigravityRecent: false, projectsRoot: true },
          createdAt: 1000
        },
        {
          name: "Project C",
          path: "C:\\Projects\\Project C",
          type: "folder",
          exists: true,
          source: { antigravityRecent: false, projectsRoot: true },
          createdAt: 3000
        }
      ];

      // Query 'Project' matches all 4 with identical Tier 2 / prefix score
      const sortedByDesc = filterAndRankProjects(tieProjects, "Project", "name_desc");
      expect(sortedByDesc.map((p) => p.name)).toEqual([
        "Project D",
        "Project C",
        "Project B",
        "Project A"
      ]);

      const sortedByCreated = filterAndRankProjects(tieProjects, "Project", "created_desc");
      expect(sortedByCreated.map((p) => p.name)).toEqual([
        "Project D",
        "Project C",
        "Project B",
        "Project A"
      ]);

      const sortedByAsc = filterAndRankProjects(tieProjects, "Project", "name_asc");
      expect(sortedByAsc.map((p) => p.name)).toEqual([
        "Project A",
        "Project B",
        "Project C",
        "Project D"
      ]);
    });
  });

  describe("Pinned Projects", () => {
    const mixedProjects: Project[] = [
      {
        name: "Project Z",
        path: "C:\\Projects\\Project Z",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        pinned: true
      },
      {
        name: "Project A",
        path: "C:\\Projects\\Project A",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        pinned: false
      },
      {
        name: "Project Y",
        path: "C:\\Projects\\Project Y",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        pinned: true
      },
      {
        name: "Project B",
        path: "C:\\Projects\\Project B",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        pinned: false
      }
    ];

    it("places all pinned projects before unpinned projects in name_asc sort", () => {
      const sorted = filterAndRankProjects(mixedProjects, "", "name_asc");
      expect(sorted.map((p) => p.name)).toEqual([
        "Project Y", // pinned, alphabetical
        "Project Z", // pinned, alphabetical
        "Project A", // unpinned, alphabetical
        "Project B"  // unpinned, alphabetical
      ]);
    });

    it("prioritizes pinned projects during search matches", () => {
      const searchRes = filterAndRankProjects(mixedProjects, "Project", "name_asc");
      // All 4 match prefix 'Project', pinned should appear first
      expect(searchRes.map((p) => p.name)).toEqual([
        "Project Y",
        "Project Z",
        "Project A",
        "Project B"
      ]);
    });
  });

  describe("Tags & Filtering", () => {
    const taggedProjects: Project[] = [
      {
        name: "Auth Service",
        path: "C:\\Projects\\Auth Service",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        tags: ["backend", "security"]
      },
      {
        name: "Web Portal",
        path: "C:\\Projects\\Web Portal",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        tags: ["frontend", "react"]
      },
      {
        name: "Billing Worker",
        path: "C:\\Projects\\Billing Worker",
        type: "folder",
        exists: true,
        source: { antigravityRecent: false, projectsRoot: true },
        tags: ["backend", "payments"]
      }
    ];

    it("filters strictly by tag when query starts with '#'", () => {
      const res = filterAndRankProjects(taggedProjects, "#backend");
      expect(res.map((p) => p.name)).toEqual(["Auth Service", "Billing Worker"]);

      const resSecurity = filterAndRankProjects(taggedProjects, "#security");
      expect(resSecurity.map((p) => p.name)).toEqual(["Auth Service"]);

      const resNone = filterAndRankProjects(taggedProjects, "#missing");
      expect(resNone.length).toBe(0);
    });

    it("matches projects when tag contains search term", () => {
      const res = filterAndRankProjects(taggedProjects, "react");
      expect(res.length).toBe(1);
      expect(res[0]?.name).toBe("Web Portal");
    });

    it("filters projects by multiple active tags using OR logic", () => {
      // Multiple tags: matches any project having at least one of the tags
      const res = filterAndRankProjects(taggedProjects, "", "name_asc", ["security", "payments"]);
      expect(res.map((p) => p.name)).toEqual(["Auth Service", "Billing Worker"]);

      const resSingle = filterAndRankProjects(taggedProjects, "", "name_asc", ["react"]);
      expect(resSingle.map((p) => p.name)).toEqual(["Web Portal"]);

      const resNone = filterAndRankProjects(taggedProjects, "", "name_asc", ["nonexistent"]);
      expect(resNone.length).toBe(0);
    });

    it("combines active tag filter with text search query", () => {
      const res = filterAndRankProjects(taggedProjects, "Billing", "recent", ["backend"]);
      expect(res.length).toBe(1);
      expect(res[0]?.name).toBe("Billing Worker");
    });

    it("extracts unique tags with correct project counts sorted alphabetically", () => {
      const tagCounts = getUniqueTagsWithCounts(taggedProjects);
      expect(tagCounts).toEqual([
        { tag: "backend", count: 2 },
        { tag: "frontend", count: 1 },
        { tag: "payments", count: 1 },
        { tag: "react", count: 1 },
        { tag: "security", count: 1 }
      ]);
    });
  });
});
