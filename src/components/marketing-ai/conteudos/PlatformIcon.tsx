import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiTiktok,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import type { CanalPlataforma } from "./conteudos-data";
import { cn } from "@/lib/utils";

interface PlatformIconProps {
  platform: CanalPlataforma;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PlatformIcon({
  platform,
  className,
  size = "sm",
}: PlatformIconProps) {
  const sizeMap = {
    sm: "size-4 p-0.5",
    md: "size-5 p-1",
    lg: "size-6 p-1",
  };

  switch (platform) {
    case "instagram":
      return (
        <div
          className={cn(
            "rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs",
            sizeMap[size],
            className,
          )}
          title="Instagram"
        >
          <SiInstagram className="size-full" />
        </div>
      );
    case "youtube":
      return (
        <div
          className={cn(
            "rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs",
            sizeMap[size],
            className,
          )}
          title="YouTube"
        >
          <SiYoutube className="size-full" />
        </div>
      );
    case "tiktok":
      return (
        <div
          className={cn(
            "rounded-full bg-black border border-white/20 text-white flex items-center justify-center shrink-0 shadow-xs",
            sizeMap[size],
            className,
          )}
          title="TikTok"
        >
          <SiTiktok className="size-full" />
        </div>
      );
    case "linkedin":
      return (
        <div
          className={cn(
            "rounded-full bg-[#0077B5] text-white flex items-center justify-center shrink-0 shadow-xs",
            sizeMap[size],
            className,
          )}
          title="LinkedIn"
        >
          <SiLinkedin className="size-full" />
        </div>
      );
    case "facebook":
      return (
        <div
          className={cn(
            "rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs",
            sizeMap[size],
            className,
          )}
          title="Facebook"
        >
          <SiFacebook className="size-full" />
        </div>
      );
    case "whatsapp":
      return (
        <div
          className={cn(
            "rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs",
            sizeMap[size],
            className,
          )}
          title="WhatsApp"
        >
          <SiWhatsapp className="size-full" />
        </div>
      );
    default:
      return null;
  }
}
