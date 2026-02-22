import {
  assertInvitationReceiverMatch,
  assertNotSelfInvite,
  normalizeEmail,
} from "../invitationAcceptance";

describe("invitation acceptance guards", () => {
  test("normalizeEmail trims and lowercases", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  test("assertNotSelfInvite throws for same email regardless of casing/whitespace", () => {
    expect(() => assertNotSelfInvite("Sender@Email.com", "  sender@email.COM ")).toThrow(
      "You cannot invite yourself."
    );
  });

  test("assertNotSelfInvite allows different emails", () => {
    expect(() => assertNotSelfInvite("sender@email.com", "receiver@email.com")).not.toThrow();
  });

  test("assertInvitationReceiverMatch throws for wrong logged-in user", () => {
    expect(() =>
      assertInvitationReceiverMatch("wrong-user@email.com", "intended-user@email.com")
    ).toThrow("This invitation is for a different email address.");
  });

  test("assertInvitationReceiverMatch allows intended receiver with case/whitespace differences", () => {
    expect(() =>
      assertInvitationReceiverMatch("  Intended-User@email.com ", "intended-user@EMAIL.com")
    ).not.toThrow();
  });
});
