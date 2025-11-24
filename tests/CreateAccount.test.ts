import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { appRouter } from "@/server/routers";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: mockDeep(),
}));

// Mock the account number generator
vi.mock("@/server/utils/generateAccountNumber", () => ({
  generateAccountNumber: vi.fn(() => "1234567890"),
}));

describe("createAccount", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create caller with mock context
    caller = appRouter.createCaller({
      user: { id: 1, email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });
  });

  it("should create an account successfully", async () => {
    // Mock: Check for existing account - returns nothing (no conflict)
    const mockExistingCheck = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(undefined), // No existing account
    };
    
    // Mock: Check if account number is unique - returns nothing (is unique)
    const mockUniqueCheck = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(undefined), // Number is unique
    };
    
    // Mock: Fetch created account - returns the new account
    const mockFetchAccount = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        accountNumber: "1234567890",
        accountType: "checking",
        balance: 0,
        status: "active",
      }),
    };

    // Queue up the three select() calls in order
    vi.mocked(db.select)
      .mockReturnValueOnce(mockExistingCheck as any)
      .mockReturnValueOnce(mockUniqueCheck as any)
      .mockReturnValueOnce(mockFetchAccount as any);

    // Mock: Insert succeeds (returns nothing, just resolves)
    const mockInsert = {
      values: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    // Call the procedure
    const result = await caller.account.createAccount({ 
      accountType: "checking" 
    });

    // Verify the result
    expect(result).toEqual({
      id: 1,
      userId: 1,
      accountNumber: "1234567890",
      accountType: "checking",
      balance: 0,
      status: "active",
    });
  });

  it("should throw an error if account creation fails in the database", async () => {
  // Mock: Check for existing account - returns nothing (no conflict)
  const mockExistingCheck = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(undefined), // No existing account
  };
  
  // Mock: Check if account number is unique - returns nothing (is unique)
  const mockUniqueCheck = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(undefined), // Number is unique
  };

  // Queue up the two select() calls
  vi.mocked(db.select)
    .mockReturnValueOnce(mockExistingCheck as any)
    .mockReturnValueOnce(mockUniqueCheck as any);

  // Mock: Insert FAILS with a database error
  const mockInsert = {
    values: vi.fn().mockRejectedValue(
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create account",
      })
    ),
  };
  vi.mocked(db.insert).mockReturnValue(mockInsert as any);

  // Call the procedure and expect it to throw
  await expect(
    caller.account.createAccount({ accountType: "checking" })
  ).rejects.toThrow(
    new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create account",
    })
  );
});
});
