import { describe, it, expect } from "vitest";
import { parseTriageConfig } from "../lib/parseConfig";

describe("parseTriageConfig", () => {
  it("returns empty groups for empty string", () => {
    const config = parseTriageConfig("");
    expect(config.groups).toEqual([]);
  });

  it("returns empty groups for invalid YAML", () => {
    const config = parseTriageConfig("}{][not yaml");
    expect(config.groups).toEqual([]);
  });

  it("returns empty groups for scalar YAML", () => {
    const config = parseTriageConfig("hello");
    expect(config.groups).toEqual([]);
  });

  it("parses a single group", () => {
    const yaml = `
ready-to-merge:
  - approved
  - ci-passed
`;
    const config = parseTriageConfig(yaml);
    expect(config.groups).toHaveLength(1);
    expect(config.groups[0]).toEqual({
      name: "ready-to-merge",
      labels: ["approved", "ci-passed"],
    });
  });

  it("parses multiple groups", () => {
    const yaml = `
ready-to-merge:
  - approved
  - ci-passed

needs-review:
  - needs-review
  - size:S

blocked:
  - do-not-merge
`;
    const config = parseTriageConfig(yaml);
    expect(config.groups).toHaveLength(3);
    expect(config.groups[0].name).toBe("ready-to-merge");
    expect(config.groups[0].labels).toEqual(["approved", "ci-passed"]);
    expect(config.groups[1].name).toBe("needs-review");
    expect(config.groups[1].labels).toEqual(["needs-review", "size:S"]);
    expect(config.groups[2].name).toBe("blocked");
    expect(config.groups[2].labels).toEqual(["do-not-merge"]);
  });

  it("preserves group order", () => {
    const yaml = `
z-last:
  - z
a-first:
  - a
m-middle:
  - m
`;
    const config = parseTriageConfig(yaml);
    expect(config.groups.map((g) => g.name)).toEqual(["z-last", "a-first", "m-middle"]);
  });

  it("filters out non-string labels", () => {
    const yaml = `
test:
  - valid-label
  - 123
  - true
`;
    const config = parseTriageConfig(yaml);
    // Only string "valid-label" should remain; numbers/booleans get filtered
    expect(config.groups[0].labels).toEqual(["valid-label"]);
  });

  it("skips keys with non-array values", () => {
    const yaml = `
valid:
  - label-a
invalid: "not an array"
also-invalid: 42
`;
    const config = parseTriageConfig(yaml);
    expect(config.groups).toHaveLength(1);
    expect(config.groups[0].name).toBe("valid");
  });

  it("handles empty arrays", () => {
    const yaml = `
empty-group: []
`;
    const config = parseTriageConfig(yaml);
    expect(config.groups).toHaveLength(1);
    expect(config.groups[0].labels).toEqual([]);
  });

  it("handles labels with special characters", () => {
    const yaml = `
special:
  - "vouch:trusted"
  - "has:approval"
  - "size:S"
`;
    const config = parseTriageConfig(yaml);
    expect(config.groups[0].labels).toEqual(["vouch:trusted", "has:approval", "size:S"]);
  });

  it("returns empty groups for YAML that parses to an array", () => {
    const yaml = "- item1\n- item2\n";
    const config = parseTriageConfig(yaml);
    // Arrays are objects but Object.entries on them yields index keys
    // which won't have array values, so groups should be empty
    expect(config.groups).toEqual([]);
  });

  it("handles deeply nested values (ignores non-array values)", () => {
    const yaml = `
group:
  nested:
    - label
`;
    const config = parseTriageConfig(yaml);
    // The value of "group" is an object, not an array, so it's skipped
    expect(config.groups).toEqual([]);
  });

  it("handles YAML with only comments", () => {
    const yaml = "# This is a comment\n# Another comment\n";
    const config = parseTriageConfig(yaml);
    expect(config.groups).toEqual([]);
  });

  it("handles duplicate group names in YAML gracefully", () => {
    // The yaml library throws on duplicate keys by default,
    // which our try/catch handles by returning empty groups
    const yaml = "dupe:\n  - first\ndupe:\n  - second\n";
    const config = parseTriageConfig(yaml);
    expect(config.groups).toEqual([]);
  });
});
