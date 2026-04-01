import { describe, it, expect } from "vitest";
import { ODataQueryBuilder, ODataError } from "./odataService";

describe("ODataQueryBuilder", () => {
  describe("build", () => {
    it("auto-injects cross-company=true by default", () => {
      const qs = ODataQueryBuilder.build({});
      expect(qs).toBe("cross-company=true");
    });

    it("omits cross-company when explicitly false", () => {
      const qs = ODataQueryBuilder.build({ crossCompany: false });
      expect(qs).toBe("");
    });

    it("builds filter param", () => {
      const qs = ODataQueryBuilder.build({ filter: "Name eq 'Test'" });
      expect(qs).toContain("$filter=Name eq 'Test'");
      expect(qs).toContain("cross-company=true");
    });

    it("builds select param", () => {
      const qs = ODataQueryBuilder.build({ select: "Name,Id" });
      expect(qs).toContain("$select=Name,Id");
    });

    it("builds expand param", () => {
      const qs = ODataQueryBuilder.build({ expand: "Lines" });
      expect(qs).toContain("$expand=Lines");
    });

    it("builds top and skip params", () => {
      const qs = ODataQueryBuilder.build({ top: 10, skip: 20 });
      expect(qs).toContain("$top=10");
      expect(qs).toContain("$skip=20");
    });

    it("builds orderby param", () => {
      const qs = ODataQueryBuilder.build({ orderby: "Name asc" });
      expect(qs).toContain("$orderby=Name asc");
    });

    it("builds count param", () => {
      const qs = ODataQueryBuilder.build({ count: true });
      expect(qs).toContain("$count=true");
    });

    it("combines all params", () => {
      const qs = ODataQueryBuilder.build({
        filter: "Name eq 'A'",
        select: "Name",
        top: 5,
        orderby: "Name",
        count: true,
      });
      expect(qs).toContain("cross-company=true");
      expect(qs).toContain("$filter=Name eq 'A'");
      expect(qs).toContain("$select=Name");
      expect(qs).toContain("$top=5");
      expect(qs).toContain("$orderby=Name");
      expect(qs).toContain("$count=true");
    });
  });

  describe("parse", () => {
    it("parses filter", () => {
      const opts = ODataQueryBuilder.parse("$filter=Name eq 'Test'");
      expect(opts.filter).toBe("Name eq 'Test'");
    });

    it("parses select", () => {
      const opts = ODataQueryBuilder.parse("$select=Name,Id");
      expect(opts.select).toBe("Name,Id");
    });

    it("parses top as number", () => {
      const opts = ODataQueryBuilder.parse("$top=10");
      expect(opts.top).toBe(10);
    });

    it("parses skip as number", () => {
      const opts = ODataQueryBuilder.parse("$skip=20");
      expect(opts.skip).toBe(20);
    });

    it("parses cross-company", () => {
      const opts = ODataQueryBuilder.parse("cross-company=true");
      expect(opts.crossCompany).toBe(true);
    });

    it("parses count", () => {
      const opts = ODataQueryBuilder.parse("$count=true");
      expect(opts.count).toBe(true);
    });

    it("returns undefined for missing params", () => {
      const opts = ODataQueryBuilder.parse("");
      expect(opts.filter).toBeUndefined();
      expect(opts.select).toBeUndefined();
      expect(opts.top).toBeUndefined();
    });

    it("roundtrips build/parse", () => {
      const original = { filter: "Name eq 'A'", select: "Name,Id", top: 5, crossCompany: true };
      const qs = ODataQueryBuilder.build(original);
      const parsed = ODataQueryBuilder.parse(qs);
      expect(parsed.filter).toBe(original.filter);
      expect(parsed.select).toBe(original.select);
      expect(parsed.top).toBe(original.top);
      expect(parsed.crossCompany).toBe(true);
    });
  });
});

describe("ODataError", () => {
  it("sets name to ODataError", () => {
    const err = new ODataError("test", "CODE");
    expect(err.name).toBe("ODataError");
    expect(err.message).toBe("test");
    expect(err.code).toBe("CODE");
  });

  it("stores details and suggestion", () => {
    const err = new ODataError("msg", "C", "detail", "suggestion");
    expect(err.details).toBe("detail");
    expect(err.suggestion).toBe("suggestion");
  });

  it("is instanceof Error", () => {
    const err = new ODataError("test", "CODE");
    expect(err).toBeInstanceOf(Error);
  });
});
