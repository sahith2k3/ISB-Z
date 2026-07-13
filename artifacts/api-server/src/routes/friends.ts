import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, friendshipsTable } from "@workspace/db";
import {
  ListFriendsParams,
  ListFriendsResponse,
  AddFriendParams,
  AddFriendBody,
  AddFriendResponse,
  RemoveFriendParams,
} from "@workspace/api-zod";
import { getStudentById, getLiveStatus, toStudentSummary } from "../lib/campusData";

const router: IRouter = Router();

router.get("/students/:id/friends", async (req, res): Promise<void> => {
  const params = ListFriendsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const owner = getStudentById(params.data.id);
  if (!owner) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(eq(friendshipsTable.ownerId, params.data.id));

  const entries = rows
    .map((row) => {
      const friend = getStudentById(row.friendId);
      if (!friend) return null;
      const status = getLiveStatus(friend.id);
      return { student: toStudentSummary(friend), ...status };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    // free friends first, then alphabetical by name
    .sort((a, b) => {
      if (a.isInClass !== b.isInClass) return a.isInClass ? 1 : -1;
      return a.student.name.localeCompare(b.student.name);
    });

  res.json(ListFriendsResponse.parse(entries));
});

router.post("/students/:id/friends", async (req, res): Promise<void> => {
  const params = AddFriendParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AddFriendBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const ownerId = params.data.id;
  const friendId = body.data.friendId;

  if (ownerId === friendId) {
    res.status(400).json({ error: "You cannot add yourself as a friend" });
    return;
  }

  const owner = getStudentById(ownerId);
  if (!owner) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const friend = getStudentById(friendId);
  if (!friend) {
    res.status(404).json({ error: "Friend not found" });
    return;
  }

  const existing = await db
    .select()
    .from(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.ownerId, ownerId),
        eq(friendshipsTable.friendId, friendId),
      ),
    );

  if (existing.length > 0) {
    res.status(400).json({ error: "Already friends" });
    return;
  }

  await db.insert(friendshipsTable).values({ ownerId, friendId });

  const status = getLiveStatus(friend.id);
  res.status(201).json(
    AddFriendResponse.parse({ student: toStudentSummary(friend), ...status }),
  );
});

router.delete("/students/:id/friends/:friendId", async (req, res): Promise<void> => {
  const params = RemoveFriendParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const deleted = await db
    .delete(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.ownerId, params.data.id),
        eq(friendshipsTable.friendId, params.data.friendId),
      ),
    )
    .returning();

  if (deleted.length === 0) {
    res.status(404).json({ error: "Friendship not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
