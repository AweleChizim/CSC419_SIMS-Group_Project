/**
 * Notifications Queries
 * 
 * Provides queries for fetching user notifications.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { validateSessionToken } from "./lib/session";

/**
 * Get notifications for the current user
 * Returns all notifications for the authenticated user, ordered by creation date (newest first)
 */
export const getMyNotifications = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate session token and get user
    if (!args.token) {
      return [];
    }

    const userId = await validateSessionToken(ctx.db, args.token);
    if (!userId) {
      return [];
    }

    // Get all notifications for this user, ordered by creation date (newest first)
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Sort by createdAt descending (newest first)
    const sortedNotifications = notifications.sort((a, b) => b.createdAt - a.createdAt);

    return sortedNotifications.map((notification) => ({
      _id: notification._id,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt,
    }));
  },
});

/**
 * Get unread notifications count for the current user
 * Returns the count of unread notifications
 */
export const getUnreadCount = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate session token and get user
    if (!args.token) {
      return 0;
    }

    const userId = await validateSessionToken(ctx.db, args.token);
    if (!userId) {
      return 0;
    }

    // Get unread notifications count using the composite index
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => 
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

