const isBullet = (line) => /^\s*([•\-*]|\d+\.)\s+/.test(line);
const stripBullet = (line) => line.replace(/^\s*([•\-*]|\d+\.)\s+/, "");

const JobDescriptionText = ({ text }) => {
  const blocks = String(text || "")
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((b) => b.split("\n").filter((l) => l.trim()))
    .filter((lines) => lines.length);

  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-foreground/90">
      {blocks.map((lines, i) => {
        const bullets = lines.filter(isBullet);
        if (bullets.length && bullets.length >= lines.length - 1) {
          const heading = isBullet(lines[0]) ? null : lines[0];
          return (
            <div key={i}>
              {heading && <h3 className="mb-2 font-medium text-foreground">{heading}</h3>}
              <ul className="space-y-1.5">
                {bullets.map((line, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand/70" />
                    <span>{stripBullet(line)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        return <p key={i}>{lines.join(" ")}</p>;
      })}
    </div>
  );
};

export default JobDescriptionText;
