import { positionLabel } from "@/lib/format";
import type { Cell, GuessFeedback, Verdict } from "@/lib/types";

const COLUMNS = ["Équipe", "Conf.", "Division", "Poste", "Taille", "Âge", "N°"];
const GRID = "grid grid-cols-[1.7fr_repeat(7,minmax(0,1fr))] gap-2";

const VERDICT_CLASS: Record<Verdict, string> = {
  correct: "bg-ok text-white",
  near: "bg-near text-near-ink",
  wrong: "bg-no text-no-ink",
};
const VERDICT_LABEL: Record<Verdict, string> = { correct: "correct", near: "proche", wrong: "faux" };

/** Texte affiché dans une case : valeur formatée + flèche éventuelle. */
function cellText(cell: Cell<string | number>, display = String(cell.value)) {
  const arrow = cell.direction === "up" ? " ↑" : cell.direction === "down" ? " ↓" : "";
  return display + arrow;
}

export function GuessGrid({ guesses }: { guesses: GuessFeedback[] }) {
  return (
    <section className="overflow-x-auto">
      <div className="flex min-w-[780px] flex-col gap-2">
        <div className={`${GRID} px-0.5 text-xs font-bold tracking-[0.08em] text-[#5a606c] uppercase`}>
          <span>Joueur</span>
          {COLUMNS.map((c) => (
            <span key={c} className="text-center">
              {c}
            </span>
          ))}
        </div>

        {guesses.length === 0 && (
          <div className="rounded-[14px] border-2 border-dashed border-line p-7 text-center text-[15px] text-[#5a606c]">
            Tes essais apparaîtront ici. Commence par n’importe quel joueur !
          </div>
        )}

        {guesses.map((g) => {
          const cells: [string, Cell<string | number>, string][] = [
            ["Équipe", g.team, cellText(g.team)],
            ["Conférence", g.conference, cellText(g.conference)],
            ["Division", g.division, cellText(g.division)],
            ["Poste", g.position, cellText(g.position, positionLabel(g.position.value))],
            ["Taille", g.height, cellText(g.height, `${g.height.value} cm`)],
            ["Âge", g.age, cellText(g.age, `${g.age.value} ans`)],
            ["Numéro", g.number, cellText(g.number)],
          ];
          return (
            <div key={g.playerId} className={`${GRID} [perspective:600px]`}>
              <div className="flex min-h-[60px] flex-col justify-center gap-0.5 rounded-xl border border-[#e1e4e9] bg-white px-3.5 py-2">
                <span className="text-[15px] leading-tight font-bold">{g.name}</span>
                <span className="text-xs text-[#5a606c]">{g.teamName}</span>
              </div>
              {cells.map(([label, cell, text], k) => (
                <div
                  key={label}
                  aria-label={`${label} : ${text}, ${VERDICT_LABEL[cell.verdict]}`}
                  style={{ animationDelay: `${k * 90}ms` }}
                  className={`flex min-h-[60px] animate-flip items-center justify-center rounded-xl p-1.5 text-center text-sm leading-tight font-bold ${VERDICT_CLASS[cell.verdict]}`}
                >
                  {text}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
