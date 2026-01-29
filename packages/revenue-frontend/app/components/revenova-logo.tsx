/**
 * Revenova Logo Component
 * Tech-savvy logo with gradient and modern design
 */

interface RevenovaLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RevenovaLogo({
  className = "",
  showText = true,
  size = "md"
}: RevenovaLogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-lg" },
    md: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-12 w-12", text: "text-3xl" },
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
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="revenovaGradientAlt" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
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
              fill="url(#revenovaGradient)"
            />

            {/* Top curve of R */}
            <path
              d="M 32 30 Q 60 20, 60 40 Q 60 55, 45 58"
              stroke="url(#revenovaGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />

            {/* Diagonal leg of R extending into upward arrow */}
            <path
              d="M 42 56 L 65 80"
              stroke="url(#revenovaGradientAlt)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Arrow head */}
            <path
              d="M 65 80 L 55 75 M 65 80 L 70 70"
              stroke="url(#revenovaGradientAlt)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Accent dots - representing data/metrics */}
            <circle cx="75" cy="25" r="4" fill="url(#revenovaGradient)" opacity="0.8" />
            <circle cx="82" cy="35" r="3" fill="url(#revenovaGradient)" opacity="0.6" />
            <circle cx="78" cy="45" r="3.5" fill="url(#revenovaGradient)" opacity="0.7" />
          </g>
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ${sizeClasses.text}`}>
            Revenova
          </span>
          <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">
            Revenue Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
