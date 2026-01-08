/**
 * Course Catalog Service
 *
 * Domain logic for managing versioned course definitions, prerequisite graphs,
 * and offering templates. This file provides a service object with method
 * stubs to be implemented.
 */

import { DatabaseReader, DatabaseWriter } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { NotFoundError } from "../errors";

export type CourseVersionPayload = {
  version: number;
  title: string;
  description: string;
  credits: number;
  prerequisites: string[]; // course codes
  isActive: boolean;
};

export const courseCatalogService = {
  async createCourseVersion(
    db: DatabaseWriter,
    courseId: Id<"courses">,
    payload: CourseVersionPayload
  ): Promise<Id<"courseVersions">> {
    const course = await db.get(courseId);
    if (!course) {
      throw new NotFoundError("Course", courseId as unknown as string);
    }

    // Determine next version number
    const existing = await db
      .query("courseVersions")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();

    let maxVersion = 0;
    for (const v of existing) {
      if (typeof v.version === "number" && v.version > maxVersion) {
        maxVersion = v.version;
      }
    }
    const nextVersion = maxVersion + 1;

    // Deactivate any currently active versions
    const activeVersions = existing.filter((v) => v.isActive);
    for (const av of activeVersions) {
      await db.patch(av._id, { isActive: false });
    }

    const createdAt = Date.now();
    const newId = await db.insert("courseVersions", {
      courseId,
      version: nextVersion,
      title: payload.title,
      description: payload.description,
      credits: payload.credits,
      prerequisites: payload.prerequisites || [],
      isActive: true,
      createdAt,
    });

    return newId;
  },

  async getCourseVersions(
    db: DatabaseReader,
    courseId: Id<"courses">
  ): Promise<any[]> {
    const versions = await db
      .query("courseVersions")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();

    // Return sorted by version ascending
    return versions.sort((a, b) => (a.version ?? 0) - (b.version ?? 0));
  },

  async getCurrentCourseVersion(
    db: DatabaseReader,
    courseId: Id<"courses">
  ): Promise<any | null> {
    // Try compound index first
    let current = await db
      .query("courseVersions")
      .withIndex("by_courseId_isActive", (q) => q.eq("courseId", courseId).and(q.eq("isActive", true)))
      .first();

    if (!current) {
      // Fallback: scan versions for active flag
      const versions = await db
        .query("courseVersions")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
        .collect();
      current = versions.find((v) => v.isActive) || null;
    }

    return current || null;
  },

  async archiveCourseVersion(
    db: DatabaseWriter,
    courseVersionId: Id<"courseVersions">
  ): Promise<void> {
    const cv = await db.get(courseVersionId);
    if (!cv) {
      throw new NotFoundError("CourseVersion", courseVersionId as unknown as string);
    }

    if (!cv.isActive) {
      return; // already archived
    }

    await db.patch(courseVersionId, { isActive: false });
  },

  async getPrerequisitesGraph(
    db: DatabaseReader,
    courseId: Id<"courses">
  ): Promise<Record<string, string[]>> {
    const course = await db.get(courseId);
    if (!course) {
      throw new NotFoundError("Course", courseId as unknown as string);
    }

    const startCode: string = course.code;

    // adjacency map from course code -> array of prerequisite course codes
    const adjacency = new Map<string, string[]>();

    // visited set to avoid re-processing nodes
    const visited = new Set<string>();

    // recursion stack to detect cycles
    const stack = new Set<string>();

    const MAX_DEPTH = 50;

    async function resolve(code: string, depth = 0): Promise<void> {
      if (visited.has(code)) return;
      if (depth > MAX_DEPTH) {
        // stop deep recursion to avoid DoS
        adjacency.set(code, adjacency.get(code) ?? []);
        visited.add(code);
        return;
      }

      if (stack.has(code)) {
        // cycle detected; record node and stop deeper recursion
        adjacency.set(code, adjacency.get(code) ?? []);
        visited.add(code);
        return;
      }

      stack.add(code);

      // Try to resolve course by code
      const c = await db
        .query("courses")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();

      const prereqs: string[] = c && Array.isArray(c.prerequisites) ? c.prerequisites : [];

      adjacency.set(code, prereqs);

      for (const p of prereqs) {
        await resolve(p, depth + 1);
      }

      stack.delete(code);
      visited.add(code);
    }

    await resolve(startCode);

    // convert adjacency map to plain object for frontend
    const result: Record<string, string[]> = {};
    for (const [k, v] of adjacency.entries()) {
      result[k] = v;
    }

    return result;
  },

  async validatePrerequisiteChain(
    db: DatabaseReader,
    courseId: Id<"courses">,
    maxDepth: number = 50
  ): Promise<void> {
    // TODO: validate that prerequisite graph has no cycles and is within bounds
    throw new Error("Not implemented: validatePrerequisiteChain");
  },

  async getOfferingTemplates(
    db: DatabaseReader,
    courseId: Id<"courses">
  ): Promise<any[]> {
    // TODO: return offering templates derived from current course version
    throw new Error("Not implemented: getOfferingTemplates");
  },
};
