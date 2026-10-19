import Image from "next/image";

// Icons supplied for "Nos valeurs", in the order of the values list.
const icons = [
  { src: "/images/valeurs/dent.png", width: 208, height: 208, sparkle: true },
  { src: "/images/valeurs/praticien.png", width: 320, height: 268 },
  { src: "/images/valeurs/fauteuil.png", width: 270, height: 292 },
  { src: "/images/valeurs/deontologie.png", width: 338, height: 269 },
] as const;

export function ValueIcon({ index }: { index: number }) {
  const icon = icons[index % icons.length];
  return (
    <span className="value-icon" aria-hidden="true">
      <Image src={icon.src} alt="" width={icon.width} height={icon.height} sizes="96px" />
      {"sparkle" in icon && <Image className="value-icon__sparkle" src="/images/valeurs/etoile.png" alt="" width={84} height={88} sizes="32px" />}
    </span>
  );
}
