
interface JewelryBoxIconProps {
  size?: number;
  className?: string;
}

export default function JewelryBoxIcon({
  size = 34,
  className = '',
}: JewelryBoxIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Open jewellery box"
      role="img"
    >
      {/* Open lid */}
      <path
        d="M10 19L14 5H35L40 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lid detailing */}
      <path
        d="M14 9H34L37 17H12L14 9Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Diamond decoration */}
      <path
        d="M24 11L21 14L24 17L27 14L24 11Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />

      {/* Hinges */}
      <path
        d="M13 20V23M35 20V23"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Box body */}
      <path
        d="M7 23H41L38 41H10L7 23Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Inner velvet section */}
      <path
        d="M11 27H37L35 36H13L11 27Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Front decorative detail */}
      <path
        d="M18 41L20 37H28L30 41"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
