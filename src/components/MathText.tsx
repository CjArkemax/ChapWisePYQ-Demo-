import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  children: React.ReactNode;
  className?: string;
}

export function MathText({ children, className }: MathTextProps) {
  // Non-string children: render as-is (number, element, null, undefined)
  if (typeof children !== 'string') {
    return <span className={className}>{children}</span>;
  }

  // Split by $ signs to find math blocks
  const parts = children.split(/(\$[^$\n]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMath = part.length > 2 && part.startsWith('$') && part.endsWith('$');

        if (!isMath) {
          return <span key={i}>{part}</span>;
        }

        const latex = part.slice(1, -1);
        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
          output: 'html',
          strict: 'ignore',
        });

        return (
          <span
            key={i}
            className="katex-inline"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}