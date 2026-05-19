import { describe, expect, it } from "vitest";
import { calculateOutputs } from "../src/utils/calculations";
import { demoClient, demoReportQ1 } from "../src/data/demoData";

describe("PRD financial calculation rules", () => {
  it("does not subtract liabilities from net worth", () => {
    const output = calculateOutputs(demoClient, demoReportQ1);
    const expectedNetWorth =
      output.client1RetirementTotal + output.client2RetirementTotal + output.nonRetirementTotal + output.trustTotal;

    expect(output.netWorth).toBe(expectedNetWorth);
    expect(output.liabilitiesTotal).toBe(218000);
  });

  it("excludes trust from non-retirement total", () => {
    const output = calculateOutputs(demoClient, demoReportQ1);
    expect(output.nonRetirementTotal).toBe(92000);
    expect(output.trustTotal).toBe(450000);
  });

  it("calculates excess and private reserve target correctly", () => {
    const output = calculateOutputs(demoClient, demoReportQ1);
    expect(output.excessToPrivateReserve).toBe(4000);
    expect(output.privateReserveTarget).toBe(84000);
  });
});
