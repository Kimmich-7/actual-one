import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const CONFIRM_TOKEN = "RESET-DEV-CLEAR"; // change locally if you want a different token

export const clearAllAuth = internalMutation({
  args: { confirmToken: v.string() },
  handler: async (ctx, args) => {
    if (args.confirmToken !== CONFIRM_TOKEN) {
      throw new Error("Invalid confirmation token. Operation aborted.");
    }

    // Delete all user docs
    const users = await ctx.db.query("users").collect();
    for (const u of users) {
      await ctx.db.delete(u._id);
    }

    // Delete all authSessions (authTables includes authSessions)
    // If your schema doesn't include authSessions this will just return []
    const sessions = await ctx.db.query("authSessions").collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    // Delete all authAccounts
    const accounts = await ctx.db.query("authAccounts").collect();
    for (const a of accounts) {
      await ctx.db.delete(a._id);
    }

    return null;
  },
});