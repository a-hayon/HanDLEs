import { Game } from "@/components/Game";
import { PLAYERS } from "@/data/players";
import { parisDateKey } from "@/lib/target";
import { TEAMS } from "@/lib/teams";
import type { PlayerOption } from "@/lib/types";

// Recalculé à chaque visite pour que la date (et donc le joueur du jour) soit à jour.
export const dynamic = "force-dynamic";

export default function Home() {
  // Composant serveur : on n'envoie au navigateur que les noms, jamais les attributs.
  const options: PlayerOption[] = PLAYERS.map((p) => ({
    id: p.id,
    name: p.name,
    teamName: TEAMS[p.team].name,
  })).sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return (
    <main className="min-h-screen px-4 pb-16 pt-10">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-7">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className="text-accent"
              aria-hidden="true"
            >
              <circle cx="20" cy="20" r="17" />
              <path d="M3 20h34M20 3v34M8 8c5 4 5 20 0 24M32 8c-5 4-5 20 0 24" />
            </svg>
            <h1 className="text-5xl leading-none font-black tracking-tight [font-stretch:112%]">
              Han<span className="text-accent">DLE</span>s
            </h1>
          </div>
          <p className="text-[17px] text-muted">Devine le joueur NBA mystère en 8 essais.</p>
        </header>

        <Game options={options} todayKey={parisDateKey()} />

        <footer className="text-center text-[13px] text-muted">
          {options.length} joueurs · effectifs de fin de saison 2025-26
        </footer>
      </div>
    </main>
  );
}
