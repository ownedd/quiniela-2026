import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sin autenticación");
    }

    console.log("Sincronizando usuario:", identity.subject, identity.name, identity.email);

    // Check if we've already stored this user.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const name = identity.name || [identity.givenName, identity.familyName].filter(Boolean).join(" ") || "Sin Nombre";
    const email = identity.email || "sin@email.com";
    const image = identity.pictureUrl || "";

    if (user !== null) {
      // If we've seen this user before but the name or email has changed, patch it.
      if (user.name !== name || user.email !== email || user.image !== image) {
        await ctx.db.patch(user._id, { name, email, image });
      }
      return user._id;
    }

    // If it's a new identity, create a new User.
    return await ctx.db.insert("users", {
      name,
      email,
      image,
      clerkId: identity.subject,
      score: 0,
    });
  },
});


export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").collect();
  },
});

