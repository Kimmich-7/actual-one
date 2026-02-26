import { internalMutation } from "../_generated/server";

export const migrateGradesToString = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users with numeric grades
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      if (typeof user.grade === "number") {
        // Convert numeric grade to string format
        await ctx.db.patch(user._id, {
          grade: `Grade ${user.grade}`
        });
        console.log(`Updated user ${user._id} grade from ${user.grade} to Grade ${user.grade}`);
      }
    }
    
    console.log("Grade migration completed");
    return { success: true, updatedUsers: users.length };
  },
});