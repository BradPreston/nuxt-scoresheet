import { defineRelations } from "drizzle-orm";

import { account, session, user } from "./auth";
import { game } from "./game";
import { gameType } from "./game-type";
import { round } from "./round";
import { score } from "./score";

export const relations = defineRelations({ user, session, account, score, game, round, gameType }, r => ({
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    scores: r.many.score({
      from: r.user.id,
      to: r.score.userId,
    }),
  },
  session: {
    user: r.one.user(),
  },
  account: {
    user: r.one.user(),
  },
  game: {
    rounds: r.many.round({
      from: r.game.id,
      to: r.round.gameId,
    }),
    gameType: r.one.gameType(),
  },
  round: {
    game: r.one.game(),
    scores: r.many.score({
      from: r.round.id,
      to: r.score.roundId,
    }),
  },
  score: {
    user: r.one.user(),
    round: r.one.round(),
  },
  gameType: {
    games: r.many.game({
      from: r.gameType.id,
      to: r.game.gameTypeId,
    }),
  },
}));
