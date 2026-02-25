import { buildConvexEvent } from "../posthog";

describe("buildConvexEvent", () => {
  it("builds invitation_accepted payload with invitation id", () => {
    const payload = buildConvexEvent("invitation_accepted", "user_1", {
      invitation_id: "inv_123",
    });
    expect(payload.event).toBe("invitation_accepted");
    expect(payload.distinct_id).toBe("user_1");
    expect(payload.properties.invitation_id).toBe("inv_123");
    expect(payload.properties.source).toBe("convex");
  });
});

