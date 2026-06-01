

const CODE_LINES = [
  `@RootCommand({"greet"})`,
  `public class GreetCommand {`,
  `    @Execute`,
  `    public void execute(`,
  `        Player source,`,
  `        @Named("name") String name`,
  `    ) {`,
  `        source.sendMessage(`,
  `            "Hello, " + name + "!"`,
  `        );`,
  `    }`,
  `}`,
];

function tokenizeLine(line: string) {
  const parts = line.split(
    /(@\w+|"[^"]*"|\b(?:public|class|void|implements|private|static|final|String|int|boolean|return)\b)/g
  );
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('@'))
      return (
        <span key={i} className="text-secondary">
          {part}
        </span>
      );
    if (part.startsWith('"'))
      return (
        <span key={i} className="text-green-400">
          {part}
        </span>
      );
    if (
      ['public', 'class', 'void', 'implements', 'private', 'static', 'final', 'String', 'int', 'boolean', 'return'].includes(part)
    )
      return (
        <span key={i} className="text-primary">
          {part}
        </span>
      );
    return <span key={i}>{part}</span>;
  });
}

export function HeroCodeBlock() {
  return (
    <div className="relative group">
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-primary/5 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Terminal window */}
      <div className="relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-card/60">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground/60 font-mono ml-3">
            Imperat · GreetCommand.java
          </span>
        </div>

        {/* Code content */}
        <div className="p-5">
          <pre className="m-0">
            <code className="font-mono text-sm leading-relaxed text-foreground/90">
              {CODE_LINES.map((line, i) => (
                <div
                  key={i}
                  className="motion-safe:animate-fadein"
                  style={{ animationDelay: `${0.1 + i * 0.06}s` }}
                >
                  <span className="select-none text-muted-foreground/30 mr-4 inline-block w-5 text-right text-xs">
                    {i + 1}
                  </span>
                  {tokenizeLine(line)}
                  {'\n'}
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export default HeroCodeBlock;
