import { describe, it, expect } from "vitest";
import { parseLinkedIssues } from "../lib/parseIssues";

describe("parseLinkedIssues", () => {
  it("returns empty array for empty body", () => {
    expect(parseLinkedIssues("")).toEqual([]);
  });

  it("returns empty array for null-ish body", () => {
    expect(parseLinkedIssues("")).toEqual([]);
  });

  it("parses 'Fixes #123'", () => {
    const issues = parseLinkedIssues("Fixes #123");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: "Fixes", number: 123 });
  });

  it("parses 'fixes #456' (lowercase)", () => {
    const issues = parseLinkedIssues("fixes #456");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: "fixes", number: 456 });
  });

  it("parses 'Closes #789'", () => {
    const issues = parseLinkedIssues("Closes #789");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: "Closes", number: 789 });
  });

  it("parses 'Resolves #42'", () => {
    const issues = parseLinkedIssues("Resolves #42");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: "Resolves", number: 42 });
  });

  it("parses 'Fixed #10'", () => {
    const issues = parseLinkedIssues("Fixed #10");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: "Fixed", number: 10 });
  });

  it("parses 'Closed #5'", () => {
    const issues = parseLinkedIssues("Closed #5");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: "Closed", number: 5 });
  });

  it("parses 'Resolved #99'", () => {
    const issues = parseLinkedIssues("Resolved #99");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: "Resolved", number: 99 });
  });

  it("parses multiple keyword references", () => {
    const issues = parseLinkedIssues("Fixes #1, Closes #2, Resolves #3");
    expect(issues).toHaveLength(3);
    expect(issues.map((i) => i.number)).toEqual([1, 2, 3]);
  });

  it("deduplicates same issue number", () => {
    const issues = parseLinkedIssues("Fixes #10\nCloses #10");
    expect(issues).toHaveLength(1);
    expect(issues[0].number).toBe(10);
  });

  it("parses cross-repo references like 'Fixes owner/repo#123'", () => {
    const issues = parseLinkedIssues("Fixes owner/repo#123");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: "Fixes", number: 123 });
  });

  it("parses standalone #NNN references", () => {
    const issues = parseLinkedIssues("Related to #55 and #66");
    expect(issues).toHaveLength(2);
    expect(issues[0]).toMatchObject({ keyword: "references", number: 55 });
    expect(issues[1]).toMatchObject({ keyword: "references", number: 66 });
  });

  it("does not double-count keyword + standalone for same number", () => {
    const issues = parseLinkedIssues("Fixes #100. See also #100");
    expect(issues).toHaveLength(1);
    expect(issues[0].number).toBe(100);
  });

  it("handles multiline body", () => {
    const body = `
## Description
This PR fixes a bug.

Fixes #10
Closes #20

Also references #30
    `;
    const issues = parseLinkedIssues(body);
    expect(issues).toHaveLength(3);
    expect(issues.map((i) => i.number)).toEqual([10, 20, 30]);
  });

  it("returns empty for body with no issue references", () => {
    const issues = parseLinkedIssues("This is a simple PR with no linked issues.");
    expect(issues).toEqual([]);
  });

  it("handles issue numbers at start of line", () => {
    const issues = parseLinkedIssues("#42 is related");
    expect(issues).toHaveLength(1);
    expect(issues[0].number).toBe(42);
  });
});
