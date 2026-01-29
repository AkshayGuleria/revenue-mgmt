/**
 * Revenova Logo Component
 * Tech-savvy logo with gradient and modern design
 */

interface RevenovaLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  textColor?: "gradient" | "white";
}

export function RevenovaLogo({
  className = "",
  showText = true,
  size = "md",
  textColor = "gradient"
}: RevenovaLogoProps) {
  const sizes = {
    sm: { icon: "h-8 w-8", text: "text-lg" },
    md: { icon: "h-12 w-12", text: "text-xl" },
    lg: { icon: "h-18 w-18", text: "text-3xl" },
  };

  const sizeClasses = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses.icon} relative flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="revenovaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(109, 159, 238)" />
              <stop offset="50%" stopColor="rgb(179, 151, 243)" />
              <stop offset="100%" stopColor="rgb(239, 149, 194)" />
            </linearGradient>
            <linearGradient id="revenovaGradientAlt" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="revenovaWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F0F9FF" />
            </linearGradient>
          </defs>

          {/* Main Shape - Stylized "R" with upward arrow/growth symbol */}
          <g>
            {/* Base vertical line of R */}
            <rect
              x="20"
              y="20"
              width="12"
              height="60"
              rx="6"
              fill="url(#revenovaWhite)"
            />

            {/* Top curve of R */}
            <path
              d="M 32 30 Q 60 20, 60 40 Q 60 55, 45 58"
              stroke="url(#revenovaWhite)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />

            {/* Diagonal leg of R extending into upward arrow */}
            <path
              d="M 42 56 L 65 80"
              stroke="url(#revenovaWhite)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Arrow head */}
            <path
              d="M 65 80 L 55 75 M 65 80 L 70 70"
              stroke="url(#revenovaWhite)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Accent dots - representing data/metrics */}
            <circle cx="75" cy="25" r="4" fill="url(#revenovaWhite)" opacity="0.8" />
            <circle cx="82" cy="35" r="3" fill="url(#revenovaWhite)" opacity="0.6" />
            <circle cx="78" cy="45" r="3.5" fill="url(#revenovaWhite)" opacity="0.7" />
          </g>
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold ${sizeClasses.text} ${
            textColor === "white"
              ? "text-white"
              : "bg-gradient-to-l from-blue-500 via-purple-300 to-pink-300 bg-clip-text text-transparent"
          }`}>
            Revenova
          </span>
          <span className={`text-[10px] font-medium tracking-wider uppercase mt-0.5 ${
            textColor === "white"
              ? "text-white/80"
              : "bg-gradient-to-l from-blue-200 via-purple-300 to-pink-300 bg-clip-text text-transparent"
          }`}>
            Revenue Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
