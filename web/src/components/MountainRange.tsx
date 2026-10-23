interface MountainRangeProps {
  className?: string;
  /** Quantidade de planos de serra (2 a 4). Padrão: 3. */
  layers?: number;
}

const ridges = [
  // Serra distante — cristas suaves, como serras atrás da névoa
  "M0 168C90 130 170 150 250 138C340 124 400 86 500 110C590 132 640 100 730 96C830 92 880 130 980 124C1080 118 1140 84 1250 104C1340 120 1390 146 1440 138L1440 300L0 300Z",
  // Serra intermediária
  "M0 216C80 200 150 176 240 186C330 196 380 156 470 168C560 180 620 142 720 152C820 162 870 196 970 190C1070 184 1150 152 1250 172C1330 188 1390 208 1440 202L1440 300L0 300Z",
  // Serra frontal — cristas mais marcadas
  "M0 262L120 236L210 252L330 214L430 246L540 226L660 254L780 224L880 248L1010 218L1120 246L1240 224L1350 250L1440 232L1440 300L0 300Z",
  // Primeiro plano
  "M0 288L140 272L260 284L400 262L520 280L660 264L800 286L940 266L1080 284L1220 268L1360 286L1440 276L1440 300L0 300Z",
];

const layerOpacity = ["opacity-45", "opacity-65", "opacity-85", "opacity-100"];

/**
 * Serras em camadas (silhuetas de montanha com névoa), assinatura visual do
 * FleetMonitor. Usa `fill-current`, então a cor vem do `text-*` do elemento
 * pai — o mesmo componente serve aos dois temas e a qualquer superfície.
 */
export function MountainRange({ className, layers = 3 }: MountainRangeProps) {
  const count = Math.min(Math.max(layers, 2), ridges.length);

  return (
    <svg
      viewBox="0 0 1440 300"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none block h-full w-full fill-current ${className ?? ""}`}
    >
      {ridges.slice(0, count).map((path, index) => (
        <path key={path} d={path} className={layerOpacity[index]} />
      ))}
    </svg>
  );
}
