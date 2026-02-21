const baseClass =
  "inline-block px-12 py-4 bg-transparent rounded-none border border-cream-400/60 text-cream-400 hover:bg-cream-400/10 transition-all duration-300 text-xs tracking-[0.2em] uppercase font-body text-center cursor-pointer";

type CTAButtonProps = {
  children: React.ReactNode;
  className?: string;
} & (
  | { href: string; onClick?: never }
  | { onClick: () => void; href?: never }
);

export function CTAButton({ children, className, ...rest }: CTAButtonProps) {
  const cls = className ? `${baseClass} ${className}` : baseClass;

  if ("href" in rest && rest.href) {
    return (
      <a href={rest.href} className={cls}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={rest.onClick} className={cls}>
      {children}
    </button>
  );
}
