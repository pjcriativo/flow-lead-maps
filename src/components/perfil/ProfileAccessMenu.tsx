import type { ReactElement } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProfileAccessMenuProps {
  children: ReactElement;
  isSuperAdmin: boolean;
  onOpenClientAccount: () => void;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  contentClassName?: string;
}

export function ProfileAccessMenu({
  children,
  isSuperAdmin,
  onOpenClientAccount,
  align = "end",
  side = "bottom",
  contentClassName,
}: ProfileAccessMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={8}
        className={cn(
          "w-64 rounded-xl border-home-border bg-home-surface p-1.5 text-home-foreground shadow-xl",
          contentClassName,
        )}
      >
        <DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-home-muted">
          Acessar como
        </DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={onOpenClientAccount}
          className="cursor-pointer rounded-lg px-2.5 py-2.5 focus:bg-home-surface-strong focus:text-home-foreground"
        >
          <LayoutDashboard className="size-4 text-home-blue" />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold">Conta do cliente</span>
            <span className="text-[10px] text-home-muted">Área operacional do negócio</span>
          </span>
        </DropdownMenuItem>
        {isSuperAdmin ? (
          <>
            <DropdownMenuSeparator className="my-1 bg-home-border" />
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-lg px-2.5 py-2.5 focus:bg-home-orange/15 focus:text-home-orange"
            >
              <Link to="/admin">
                <ShieldCheck className="size-4 text-home-orange" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-semibold">Painel Super Admin</span>
                  <span className="text-[10px] text-home-muted">
                    Configuração geral da plataforma
                  </span>
                </span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
