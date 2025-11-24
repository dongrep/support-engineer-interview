import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { appRouter } from "@/server/routers";
import { db } from "@/lib/db";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: mockDeep(),
}));

describe("logout", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create caller with mock context
    caller = appRouter.createCaller({
      user: { id: 1, email: "test@example.com" },
      req: { cookies: { session: "valid-session-token" } } as any,
      res: { setHeader: vi.fn() } as any,
    });
  });

  it("should logout successfully by deleting the session", async () => {
    // Mock: Deletion of session
    const mockDelete = {
      where: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue(undefined),
    };

    (db.delete as any).mockReturnValue(mockDelete);

    await caller.auth.logout();

    expect(db.delete).toHaveBeenCalled();
    expect(mockDelete.where).toHaveBeenCalled();
  });

  it("should handle logout when no session token is present", async () => {
    // Create caller without session token
    const callerNoToken = appRouter.createCaller({
      user: { id: 1, email: "test@example.com" },
      req: { cookies: {} } as any,
      res: { setHeader: vi.fn() } as any,
    });

    await callerNoToken.auth.logout();

    expect(db.delete).not.toHaveBeenCalled();
  }); 
});
