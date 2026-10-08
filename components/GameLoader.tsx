"use client";

import dynamic from "next/dynamic";

/**
 * Le jeu lit sa sauvegarde dans localStorage dès le premier rendu : on le rend donc
 * uniquement côté navigateur pour éviter un décalage entre le HTML du serveur et le client.
 */
export const GameLoader = dynamic(() => import("./Game").then((m) => m.Game), {
  ssr: false,
  loading: () => <div className="h-[220px] animate-pulse rounded-[18px] bg-white/60" aria-hidden="true" />,
});
