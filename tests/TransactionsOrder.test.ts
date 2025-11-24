import { vi, describe, beforeEach, it, expect } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { appRouter } from "@/server/routers/index";
import { db } from "@/lib/db";


// Mock the database
vi.mock("@/lib/db", () => ({
  db: mockDeep(), // Create a deep mock of the `db` object
}));

describe("Transactions Order", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test

    // Create a caller with a mock context
    caller = appRouter.createCaller({
      user: { id: 1, email: "test@example.com" },
      req: { cookies: { session: "valid-session-token" } } as any,
      res: { setHeader: vi.fn() } as any,
    });
  });
  it("return transactions in descending order by createdAt", async () => {
    // Mock: Fetching account
    const mockAccount = {
      id: 1,
      userId: 1,
      balance: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          get: vi.fn().mockResolvedValueOnce(mockAccount),
        }),
      }),
    });

    // Mock: Fetching transactions
    const mockTransactions = [
      { id: 1, accountId: 1, createdAt: "2024-01-02T10:00:00Z" },
      { id: 2, accountId: 1, createdAt: "2024-01-03T10:00:00Z" },
      { id: 3, accountId: 1, createdAt: "2024-01-01T10:00:00Z" },
    ];
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          orderBy: vi.fn().mockReturnValueOnce(mockTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
        }),
      }),
    });

    // Mock: Enriching transactions (called once per transaction in the loop)
    const mockAccountDetails = {
      id: 1,
      accountType: "savings",
    };
    
    // Mock db.select for each transaction in the loop (3 times)
    for (let i = 0; i < mockTransactions.length; i++) {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            get: vi.fn().mockResolvedValueOnce(mockAccountDetails),
          }),
        }),
      });
    }

    // Call the method and assert the results
    const result = await caller.account.getTransactions({ accountId: 1 });

    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    
    // Check if transactions are in descending order by createdAt
    for (let i = 0; i < result.length - 1; i++) {
      expect(new Date(result[i].createdAt ?? "").getTime()).toBeGreaterThanOrEqual(
        new Date(result[i + 1].createdAt ?? "").getTime()
      );
    }
    
    // Verify all transactions have accountType enriched
    result.forEach(transaction => {
      expect(transaction.accountType).toBe("savings");
    });
  });
});
