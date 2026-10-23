interface TruckLogoProps {
  /** Classe de dimensionamento (altura/largura) do SVG. */
  className?: string;
  /** Espessura do traço — mantenha entre 1.2 e 1.8 para o efeito de contorno. */
  strokeWidth?: number;
  /** Quando informado, o logo ganha nome acessível (role="img" + <title>). */
  title?: string;
}

/**
 * Marca gráfica do FleetMonitor — caminhão em traço (somente contorno).
 * Sem preenchimento (`fill="none"` + `stroke="currentColor"`), o que permite
 * usá-la neutra em claro ou invertida sobre o bloco escuro da identidade.
 */
export function TruckLogo({
  className = "size-8",
  strokeWidth = 1.5,
  title,
}: TruckLogoProps) {
  return (
    <svg
      viewBox="0 0 58 34"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {/* Baú de carga */}
      <rect x="3" y="7" width="34" height="14" rx="1.5" />
      <path d="M8 7v14" />
      {/* Cabine com para-brisa */}
      <path d="M37 11h7l6 6h4.5a2.5 2.5 0 0 1 2.5 2.5V21H37z" />
      <path d="M40 14h4l3 3h-7z" />
      {/* Chassi e rodas */}
      <path d="M3 21h51.5" />
      <circle cx="14" cy="24" r="3" />
      <circle cx="47" cy="24" r="3" />
    </svg>
  );
}

interface BrandLockupProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  /** Nome acessível do logo (padrão: FleetMonitor). */
  title?: string;
}

/** Assinatura da marca: logo em contorno + wordmark em caixa alta. */
export function BrandLockup({
  className,
  iconClassName,
  textClassName,
  title = "FleetMonitor",
}: BrandLockupProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <TruckLogo
        className={`size-7 shrink-0 ${iconClassName ?? ""}`}
        strokeWidth={1.6}
        title={title}
      />
      <span
        className={`text-[13px] font-semibold uppercase leading-none tracking-[0.3em] ${
          textClassName ?? ""
        }`}
      >
        FleetMonitor
      </span>
    </span>
  );
}
