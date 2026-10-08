export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3.5 text-[13px] text-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 rounded bg-ok" />
        Correct
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 rounded bg-near" />
        Proche (poste partagé, ±5 cm, ±2 ans, ±3 n°)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 rounded border border-line bg-no" />
        Faux
      </span>
      <span>↑ ↓ la bonne valeur est plus haute / plus basse</span>
    </div>
  );
}
