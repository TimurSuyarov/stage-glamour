import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

// SVG Illustration component
function WelcomeIllustration() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="w-64 h-64 mb-8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background gradient */}
      <defs>
        <linearGradient
          id="bgGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#0070FF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient
          id="skinGradient"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FFD4A3" />
          <stop offset="100%" stopColor="#FFC89B" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="200" cy="200" r="180" fill="url(#bgGradient)" />

      {/* Decorative circles */}
      <circle cx="80" cy="80" r="25" fill="#0070FF" opacity="0.1" />
      <circle cx="320" cy="120" r="35" fill="#00D4FF" opacity="0.1" />
      <circle cx="100" cy="300" r="20" fill="#0070FF" opacity="0.08" />

      {/* Head */}
      <circle cx="200" cy="140" r="50" fill="url(#skinGradient)" stroke="#FFC89B" strokeWidth="2" />

      {/* Hair */}
      <path
        d="M 150 100 Q 150 80 200 75 Q 250 80 250 100 Q 250 110 200 115 Q 150 110 150 100"
        fill="#3D3D3D"
      />

      {/* Eyes */}
      <circle cx="185" cy="135" r="5" fill="#3D3D3D" />
      <circle cx="215" cy="135" r="5" fill="#3D3D3D" />
      <circle cx="187" cy="133" r="2.5" fill="white" />
      <circle cx="217" cy="133" r="2.5" fill="white" />

      {/* Smile */}
      <path
        d="M 190 155 Q 200 165 210 155"
        stroke="#3D3D3D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Neck */}
      <rect x="190" y="185" width="20" height="15" fill="url(#skinGradient)" />

      {/* Body - Shirt */}
      <path
        d="M 155 200 L 150 280 Q 150 290 160 290 L 240 290 Q 250 290 250 280 L 245 200 Z"
        fill="#0070FF"
        stroke="#0070FF"
        strokeWidth="1"
      />

      {/* Left arm (waving) */}
      <g>
        {/* Shoulder to elbow */}
        <line x1="160" y1="210" x2="120" y2="200" stroke="#FFD4A3" strokeWidth="12" strokeLinecap="round" />
        {/* Elbow to wrist */}
        <line x1="120" y1="200" x2="100" y2="140" stroke="#FFD4A3" strokeWidth="12" strokeLinecap="round" />
        {/* Hand */}
        <circle cx="95" cy="135" r="14" fill="url(#skinGradient)" stroke="#FFC89B" strokeWidth="1.5" />
      </g>

      {/* Right arm */}
      <line x1="240" y1="210" x2="270" y2="250" stroke="#FFD4A3" strokeWidth="12" strokeLinecap="round" />
      <circle cx="275" cy="258" r="12" fill="url(#skinGradient)" stroke="#FFC89B" strokeWidth="1.5" />

      {/* Waving hand motion */}
      <g opacity="0.6">
        <path
          d="M 85 130 Q 75 120 80 110"
          stroke="#0070FF"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <path
          d="M 75 125 Q 60 110 70 95"
          stroke="#0070FF"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      </g>

      {/* Stars/sparkles */}
      <g fill="#FFD700" opacity="0.8">
        <circle cx="280" cy="90" r="3" />
        <circle cx="290" cy="110" r="2.5" />
        <circle cx="320" cy="95" r="2" />
      </g>

      {/* Bottom decoration */}
      <circle cx="200" cy="360" r="12" fill="#0070FF" opacity="0.15" />
      <circle cx="170" cy="350" r="8" fill="#00D4FF" opacity="0.1" />
      <circle cx="230" cy="355" r="10" fill="#0070FF" opacity="0.12" />
    </svg>
  );
}

export default function WelcomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.name?.trim() || t("welcome.guest");

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-5 py-12">
      <WelcomeIllustration />

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          {t("welcome.title", { name: displayName })}
        </h1>
      </div>

      <p className="text-muted-foreground text-center text-sm sm:text-base max-w-md">
        {t("welcome.tagline")}
      </p>
    </div>
  );
}
