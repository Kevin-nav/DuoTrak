import { buildEventPayload } from "../events";

describe("buildEventPayload", () => {
  it("includes event and merges normalized properties", () => {
    const payload = buildEventPayload("onboarding_started", { platform: "web", entry_point: "signup" });
    expect(payload.event).toBe("onboarding_started");
    expect(payload.properties.platform).toBe("web");
    expect(payload.properties.entry_point).toBe("signup");
  });
});

