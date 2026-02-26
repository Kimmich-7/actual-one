import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const exportUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});