import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { generateAccountNumber } from "@/helpers/accountNumberGenerator";

export const accountRouter = router({
  createAccount: protectedProcedure
    .input(
      z.object({
        accountType: z.enum(["checking", "savings"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already has an account of this type
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.accountType, input.accountType)))
        .get();

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a ${input.accountType} account`,
        });
      }

      let accountNumber;
      let isUnique = false;

      // Generate unique account number
      while (!isUnique) {
        accountNumber = generateAccountNumber();
        const existing = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
        isUnique = !existing;
      }

      await db.insert(accounts).values({
        userId: ctx.user.id,
        accountNumber: accountNumber!,
        accountType: input.accountType,
        balance: 0,
        status: "active",
      });

      // Fetch the created account
      const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();

      if (!account) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account",
        });
      }

      return account;
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, ctx.user.id));

    return userAccounts;
  }),

  transferFromAccount: protectedProcedure
    .input(
      z.object({
        fromAccountNumber: z.string(),
        routingNumber: z.string(),
        toAccountId: z.number(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const amount = parseFloat(input.amount.toString());

      // Verify fromAccount exists and belongs to the user
      const fromAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.accountNumber, input.fromAccountNumber), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!fromAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source account not found",
        });
      }

      if (fromAccount.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Source account is not active",
        });
      }

      if (fromAccount.balance < amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient funds in source account",
        });
      }

      // Verify toAccount exists and belongs to the user
      const toAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.toAccountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!toAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Destination account not found",
        });
      }

      if (toAccount.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Destination account is not active",
        });
      }

      // Create withdrawal transaction from fromAccount
      await db.insert(transactions).values({
        accountId: fromAccount.id,
        type: "withdrawal",
        amount,
        description: `Transfer to account ${toAccount.accountNumber}`,
        status: "completed",
        processedAt: new Date().toISOString(),
      });

      // Create deposit transaction to toAccount
      await db.insert(transactions).values({
        accountId: toAccount.id,
        type: "deposit",
        amount,
        description: `Transfer from account ${fromAccount.accountNumber}`,
        status: "completed",
        processedAt: new Date().toISOString(),
      });

      // Update balances
      await db
        .update(accounts)
        .set({
          balance: fromAccount.balance - amount,
        })
        .where(eq(accounts.id, fromAccount.id));

      await db
        .update(accounts)
        .set({
          balance: toAccount.balance + amount,
        })
        .where(eq(accounts.id, toAccount.id));

      return { message: "Transfer successful" };
    }),

  fundAccountUsingCard: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        amount: z.number().positive(),
        fundingSource: z.object({
          cardNumber: z.string(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const amount = parseFloat(input.amount.toString());

      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      if (account.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account is not active",
        });
      }

      // Create transaction
      await db.insert(transactions).values({
        accountId: input.accountId,
        type: "deposit",
        amount,
        description: `Funding from card ${input.fundingSource.cardNumber.slice(-4)}`,
        status: "completed",
        processedAt: new Date().toISOString(),
      });

      // Fetch the created transaction
      const transaction = await db.select().from(transactions).orderBy(transactions.createdAt).limit(1).get();

      // Update account balance
      await db
        .update(accounts)
        .set({
          balance: account.balance + amount,
        })
        .where(eq(accounts.id, input.accountId));

      let finalBalance = account.balance;
      for (let i = 0; i < 100; i++) {
        finalBalance = finalBalance + amount / 100;
      }

      return {
        transaction,
        newBalance: finalBalance, // This will be slightly off due to float precision
      };
    }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      const accountTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, input.accountId))
        .orderBy(desc(transactions.createdAt), asc(transactions.id)); // Secondary sort to ensure consistent order

      const enrichedTransactions = [];
      for (const transaction of accountTransactions) {
        const accountDetails = await db.select().from(accounts).where(eq(accounts.id, transaction.accountId)).get();

        enrichedTransactions.push({
          ...transaction,
          accountType: accountDetails?.accountType,
        });
      }

      return enrichedTransactions;
    }),
});
