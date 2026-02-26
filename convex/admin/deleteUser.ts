import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const deleteUserById = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Double-check the doc exists
    const doc = await ctx.db.get(args.userId);
    if (!doc) throw new Error("User not found");
    await ctx.db.delete(args.userId);
    return null;
  },
});