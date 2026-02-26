import { mutation } from "./_generated/server";

export const cleanupOrphanedAuth = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete authSessions that reference a missing user
    let deleted = 0;
    for await (const session of ctx.db.query("authSessions")) {
      // some sessions might not have a userId, skip those
      // @ts-ignore
      const userId = session.userId;
      if (!userId) continue;
      const user = await ctx.db.get(userId);
      if (!user) {
        await ctx.db.delete(session._id);
        deleted++;
      }
    }

    // Delete authAccounts that reference a missing user
    for await (const account of ctx.db.query("authAccounts")) {
      // @ts-ignore
      const userId = account.userId;
      if (!userId) continue;
      const user = await ctx.db.get(userId);
      if (!user) {
        await ctx.db.delete(account._id);
        deleted++;
      }
    }

    console.log(`Deleted ${deleted} orphaned auth docs.`);
    return { deleted };
  },
});