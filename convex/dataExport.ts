import { mutation } from "./_generated/server";

export const ping = mutation({
  handler: async () => {
    return { ok: true, ts: Date.now() };
  },
});

export const exportUsers = mutation({
  handler: async (ctx) => {
    try {
      // 1) Check whether auth exists
      const hasAuth = typeof (ctx as any).auth !== "undefined";

      // 2) Try to read identity safely
      let identity: any = null;
      try {
        if ((ctx as any).auth?.getUserIdentity) {
          identity = await (ctx as any).auth.getUserIdentity();
        }
      } catch (e: any) {
        return {
          ok: false,
          stage: "getUserIdentity",
          error: e?.message ?? String(e),
          hasAuth,
        };
      }

      // 3) Try to query first record only (low-risk)
      let firstUser: any = null;
      try {
        firstUser = await ctx.db.query("users").first();
      } catch (e: any) {
        return {
          ok: false,
          stage: "query_users_first",
          error: e?.message ?? String(e),
          hasAuth,
          identity,
        };
      }

      // 4) If first record works, try full export
      let users: any[] = [];
      try {
        users = await ctx.db.query("users").collect();
      } catch (e: any) {
        return {
          ok: false,
          stage: "query_users_collect",
          error: e?.message ?? String(e),
          hasAuth,
          identity,
          firstUserExists: !!firstUser,
        };
      }

      return {
        ok: true,
        hasAuth,
        identity,
        count: users.length,
        users,
      };
    } catch (e: any) {
      return { ok: false, stage: "unexpected", error: e?.message ?? String(e) };
    }
  },
});
