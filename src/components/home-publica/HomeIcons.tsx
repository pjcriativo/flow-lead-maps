import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function GoogleMapsIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <path
        d="M24 4C15.163 4 8 11.163 8 20c0 10.5 13.5 22.8 15.1 24.2.5.4 1.3.4 1.8 0 1.6-1.4 15.1-13.7 15.1-24.2 0-8.837-7.163-16-16-16z"
        fill="#EA4335"
      />
      <path
        d="M24 4C15.163 4 8 11.163 8 20c0 4.2 1.6 8.3 4.2 11.4l11.8-14.4V4z"
        fill="#4285F4"
      />
      <path
        d="M24 17l-11.8 14.4c2.8 3.5 6.6 6.9 10 9.8l1.8 1.5 1.8-1.5c3.4-2.9 7.2-6.3 10-9.8L24 17z"
        fill="#34A853"
      />
      <path
        d="M24 4v13l11.8 14.4c2.6-3.1 4.2-7.2 4.2-11.4 0-8.837-7.163-16-16-16z"
        fill="#FBBC04"
      />
      <circle cx="24" cy="20" r="7" fill="#FFFFFF" />
      <circle cx="24" cy="20" r="5" fill="#4285F4" />
    </svg>
  );
}

export function InstagramIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <defs>
        <radialGradient
          id="ig-grad"
          cx="30%"
          cy="107%"
          r="130%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ig-grad)" />
      <rect
        x="10"
        y="10"
        width="28"
        height="28"
        rx="8"
        stroke="#ffffff"
        strokeWidth="3.2"
        fill="none"
      />
      <circle cx="24" cy="24" r="6.5" stroke="#ffffff" strokeWidth="3.2" fill="none" />
      <circle cx="31.5" cy="16.5" r="1.8" fill="#ffffff" />
    </svg>
  );
}

export function LinkedInIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <rect width="48" height="48" rx="12" fill="#0A66C2" />
      <path
        d="M15.5 12.5C13.567 12.5 12 14.067 12 16c0 1.933 1.567 3.5 3.5 3.5s3.5-1.567 3.5-3.5c0-1.933-1.567-3.5-3.5-3.5zM12.5 21.5h6V35.5h-6zM22.5 21.5h5.7v1.9h.1c.8-1.5 2.7-3.1 5.6-3.1 6 0 7.1 3.9 7.1 9.1V35.5h-6V30.2c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V35.5h-6z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function WhatsAppIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <rect width="48" height="48" rx="12" fill="#25D366" />
      <path
        d="M24 11C16.82 11 11 16.82 11 24c0 2.54.73 4.91 2 6.92L11 37l6.3-1.96A12.92 12.92 0 0024 37c7.18 0 13-5.82 13-13s-5.82-13-13-13zm6.84 18.25c-.29.81-1.68 1.55-2.34 1.64-.62.09-1.42.13-2.3-.15-.53-.17-1.22-.4-2.1-.79-3.72-1.61-6.14-5.38-6.33-5.63-.18-.25-1.52-2.02-1.52-3.86 0-1.84.96-2.74 1.3-3.11.34-.37.74-.46 1-.46.25 0 .5.01.72.02.23.01.53-.09.83.63.31.74 1.05 2.58 1.15 2.77.09.18.15.4.03.64-.12.25-.19.4-.37.61-.19.22-.39.48-.56.65-.18.18-.38.38-.16.75.21.37.95 1.57 2.04 2.54 1.4 1.25 2.58 1.63 2.95 1.82.37.18.59.15.81-.1.22-.25.93-1.08 1.18-1.46.25-.37.5-.31.83-.18.34.12 2.14 1.01 2.51 1.2.37.18.62.28.71.43.09.16.09.9-.2 1.71z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function BotAiIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="ai-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ai-grad)" />
      {/* Bot Antenna */}
      <circle cx="24" cy="11" r="2" fill="#FFFFFF" />
      <line x1="24" y1="13" x2="24" y2="17" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bot Head */}
      <rect x="12" y="17" width="24" height="20" rx="6" fill="#FFFFFF" />
      {/* Eyes */}
      <circle cx="19" cy="25" r="2.5" fill="#0891b2" />
      <circle cx="29" cy="25" r="2.5" fill="#0891b2" />
      {/* Smile */}
      <path d="M19 31c1.5 1.8 3.5 2.2 5 2.2s3.5-.4 5-2.2" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" />
      {/* Side ears */}
      <rect x="9" y="24" width="3" height="6" rx="1.5" fill="#FFFFFF" />
      <rect x="36" y="24" width="3" height="6" rx="1.5" fill="#FFFFFF" />
    </svg>
  );
}

export function PropostasContratosIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="doc-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#doc-grad)" />
      {/* Document Sheet */}
      <path
        d="M15 12h12l8 8v16c0 1.1-.9 2-2 2H15c-1.1 0-2-.9-2-2V14c0-1.1.9-2 2-2z"
        fill="#FFFFFF"
      />
      <path d="M27 12v6c0 1.1.9 2 2 2h6l-8-8z" fill="#93c5fd" />
      {/* Lines */}
      <line x1="18" y1="24" x2="28" y2="24" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="29" x2="30" y2="29" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="34" x2="25" y2="34" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FlowLogoMark({ className = "w-8 h-8", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M4 7C4 5.34315 5.34315 4 7 4H25C26.6569 4 28 5.34315 28 7C28 8.65685 26.6569 10 25 10H13C11.3431 10 10 11.3431 10 13C10 14.6569 11.3431 16 13 16H22C23.6569 16 25 17.3431 25 19C25 20.6569 23.6569 22 22 22H10V27C10 27.5523 9.55228 28 9 28H5C4.44772 28 4 27.5523 4 27V7Z"
        fill="url(#flow-orange-hub-grad)"
      />
      <path
        d="M10 10H23C24.1046 10 25 9.10457 25 8C25 6.89543 24.1046 6 23 6H10V10Z"
        fill="#FFF"
        opacity="0.35"
      />
      <defs>
        <linearGradient
          id="flow-orange-hub-grad"
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#FF4500" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function YouTubeIcon({ className = "w-5 h-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

