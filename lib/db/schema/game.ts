import { sql } from "drizzle-orm";
import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

import { gameType } from "./game-type";

export const game = sqliteTable("game", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameTypeId: integer("game_type_id")
    .notNull()
    .references(() => gameType.id, { onDelete: "cascade" }),
  completed: integer("completed", { mode: "boolean" })
    .$default(() => false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
