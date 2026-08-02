import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

import { user } from "./auth";
import { round } from "./round";

export const score = sqliteTable("score", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  roundId: integer("round_id").notNull().references(() => round.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  phase: integer("phase"),
  madePhase: integer("made_phase", { mode: "boolean" }),
});
