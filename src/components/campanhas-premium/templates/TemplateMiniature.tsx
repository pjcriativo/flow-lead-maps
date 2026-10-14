import React from "react";
import { cn } from "@/lib/utils";

interface TemplateMiniatureProps {
  templateId: string;
  className?: string;
}

/**
 * Renderizador de miniaturas com fidelidade visual idêntica ao design aprovado do Flow Business.
 * Totalmente vetorial/CSS autônomo, sem dependência de hotlinks externos ou risco de broken images.
 */
export function TemplateMiniature({ templateId, className }: TemplateMiniatureProps) {
  switch (templateId) {
    case "apresentacao-comercial":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-[#141824] p-3 text-white border border-[#232a3d] select-none",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="size-1.5 rounded-full bg-[#ff6200]" />
                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Flow Business
                </span>
              </div>
              <h4 className="text-[11.5px] font-extrabold leading-tight text-white line-clamp-3">
                Vamos impulsionar o crescimento da sua empresa?
              </h4>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-[#ff6200] px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Agendar uma conversa
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
            <svg
              className="w-full h-full object-cover opacity-85"
              viewBox="0 0 160 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="160" height="144" fill="#1e2436" />
              <circle cx="80" cy="40" r="28" fill="#334155" opacity="0.6" />
              <path d="M30 144 C30 90, 130 90, 130 144 Z" fill="#2d3748" opacity="0.8" />
              <path d="M40 95 L90 85 L120 105 L105 125 L60 120 Z" fill="#475569" opacity="0.9" />
              <path d="M75 90 L105 92 L100 112 L75 108 Z" fill="#ff6200" opacity="0.8" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-[#141824] via-transparent to-transparent" />
          </div>
        </div>
      );

    case "proposta-servicos":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-white p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-amber-700">
                Proposta
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-zinc-900 mt-1">
                Proposta de Serviços
              </h4>
              <p className="text-[8.5px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                Template ideal para envio técnico de escopos comerciais personalizados.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-zinc-900 px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Ver proposta
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden flex items-center justify-center bg-slate-50 border-l border-zinc-100">
            <svg
              className="w-full h-full"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="25" y="40" width="90" height="58" rx="4" fill="#0f172a" />
              <rect x="30" y="45" width="80" height="48" rx="2" fill="#38bdf8" opacity="0.3" />
              <rect x="15" y="98" width="110" height="6" rx="3" fill="#cbd5e1" />
              <circle cx="115" cy="30" r="12" fill="#22c55e" opacity="0.25" />
            </svg>
          </div>
        </div>
      );

    case "newsletter-corporativa":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-[#0c162e] p-3 text-white border border-[#1b2b52] select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-1.5 rounded-full bg-cyan-400" />
                <span className="text-[8.5px] font-semibold text-cyan-300 uppercase tracking-wider">
                  Edição Mensal
                </span>
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-white">
                Nossa newsletter
              </h4>
              <p className="text-[8.5px] text-slate-300 mt-1 line-clamp-2 leading-tight">
                Conteúdos que impulsionam o crescimento do seu negócio.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-blue-600 px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Ler agora
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="10" y="25" width="35" height="119" fill="#1e293b" />
              <rect x="50" y="10" width="40" height="134" fill="#334155" />
              <rect x="95" y="35" width="40" height="109" fill="#1e293b" />
              <rect x="58" y="20" width="6" height="6" fill="#38bdf8" />
              <rect x="72" y="20" width="6" height="6" fill="#38bdf8" />
              <rect x="58" y="35" width="6" height="6" fill="#f59e0b" />
              <rect x="72" y="35" width="6" height="6" fill="#38bdf8" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c162e] via-transparent to-transparent" />
          </div>
        </div>
      );

    case "convite-empresarial":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-white p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-teal-600">
                Evento Exclusivo
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-zinc-900 mt-1">
                Você está convidado!
              </h4>
              <p className="text-[8.5px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                Convide para eventos, webinars e apresentações exclusivas.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-[#ff6200] px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Confirmar presença
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden flex items-center justify-center bg-teal-50/50 border-l border-teal-100">
            <svg
              className="w-full h-full"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="30" y="20" width="80" height="104" rx="8" fill="#1e293b" />
              <rect x="36" y="26" width="68" height="92" rx="4" fill="#ffffff" />
              <rect x="44" y="36" width="35" height="6" rx="2" fill="#ff6200" />
              <rect x="44" y="48" width="52" height="4" rx="2" fill="#cbd5e1" />
              <rect x="44" y="56" width="46" height="4" rx="2" fill="#cbd5e1" />
              <circle cx="70" cy="85" r="16" fill="#0d9488" opacity="0.2" />
              <path
                d="M64 85 L68 89 L76 81"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      );

    case "followup-comercial":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-[#f8fafc] p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                Follow-up
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-zinc-900 mt-1">
                Só passando para acompanhar...
              </h4>
              <p className="text-[8.5px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                Template ideal para retomar contato e destravar respostas com cordialidade.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-[#ff6200] px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Continuar conversa
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden flex items-center justify-center bg-blue-50/40 border-l border-zinc-200">
            <svg
              className="w-full h-full"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="25"
                y="22"
                width="75"
                height="100"
                rx="4"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <line
                x1="35"
                y1="38"
                x2="85"
                y2="38"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="35"
                y1="52"
                x2="75"
                y2="52"
                stroke="#e2e8f0"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="35"
                y1="64"
                x2="80"
                y2="64"
                stroke="#e2e8f0"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="85" cy="95" r="14" fill="#ff6200" opacity="0.9" />
              <path
                d="M80 95 L84 99 L91 92"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      );

    case "pos-atendimento":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-[#131722] p-3 text-white border border-[#232c3f] select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                Relacionamento
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-white mt-1">
                Obrigado pela sua confiança!
              </h4>
              <p className="text-[8.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                Mantenha o relacionamento e garanta o melhor onboarding.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-emerald-600 px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Acessar canal
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="140" height="144" fill="#1a2233" />
              <circle cx="70" cy="50" r="30" fill="#10b981" opacity="0.2" />
              <path d="M40 90 L70 70 L100 90 L85 110 L55 110 Z" fill="#334155" />
              <path d="M60 85 L70 75 L80 85 L70 95 Z" fill="#10b981" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-[#131722] via-transparent to-transparent" />
          </div>
        </div>
      );

    case "diagnostico-comercial":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-white p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-rose-600">
                Diagnóstico
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-zinc-900 mt-1">
                Diagnóstico Comercial Gratuito
              </h4>
              <p className="text-[8.5px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                Ofereça uma consultoria inicial e identifique oportunidades.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-[#ff6200] px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Solicitar diagnóstico
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden flex items-center justify-center bg-rose-50/40 border-l border-zinc-200">
            <svg
              className="w-full h-full"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="25" y="35" width="90" height="58" rx="4" fill="#0f172a" />
              <line x1="35" y1="75" x2="55" y2="55" stroke="#22c55e" strokeWidth="2.5" />
              <line x1="55" y1="55" x2="75" y2="65" stroke="#22c55e" strokeWidth="2.5" />
              <line x1="75" y1="65" x2="100" y2="45" stroke="#22c55e" strokeWidth="2.5" />
              <rect x="60" y="93" width="20" height="15" fill="#334155" />
              <rect x="45" y="108" width="50" height="4" rx="2" fill="#cbd5e1" />
            </svg>
          </div>
        </div>
      );

    case "portfolio-servicos":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-[#0f141f] p-3 text-white border border-[#1e2738] select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Institucional
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-white mt-1">
                Conheça nosso portfólio de serviços
              </h4>
              <p className="text-[8.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                Apresente seus principais serviços de forma profissional.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-zinc-800 px-2 py-1 text-[8.5px] font-bold text-white shadow-sm border border-zinc-700">
                Ver portfólio
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 144 L40 30 L80 15 L100 144 Z" fill="#1e293b" />
              <path d="M70 144 L90 40 L130 25 L140 144 Z" fill="#334155" opacity="0.8" />
              <line x1="45" y1="45" x2="75" y2="35" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="48" y1="65" x2="78" y2="55" stroke="#38bdf8" strokeWidth="1.5" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f141f] via-transparent to-transparent" />
          </div>
        </div>
      );

    case "agendamento-reuniao":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-white p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-purple-600">
                Reunião
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-zinc-900 mt-1">
                Vamos marcar uma reunião?
              </h4>
              <p className="text-[8.5px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                Convide seus leads para uma reunião de apresentação.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-[#ff6200] px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Agendar reunião
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden flex items-center justify-center bg-purple-50/40 border-l border-zinc-200">
            <svg
              className="w-full h-full"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="30"
                y="25"
                width="80"
                height="90"
                rx="8"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <path d="M30 33 C30 29, 110 29, 110 33 L110 50 L30 50 Z" fill="#7c3aed" />
              <circle cx="50" cy="70" r="4" fill="#cbd5e1" />
              <circle cx="70" cy="70" r="4" fill="#cbd5e1" />
              <circle cx="90" cy="70" r="4" fill="#cbd5e1" />
              <circle cx="50" cy="90" r="4" fill="#cbd5e1" />
              <circle cx="70" cy="90" r="6" fill="#ff6200" />
            </svg>
          </div>
        </div>
      );

    case "lancamento-servico":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-[#090d17] p-3 text-white border border-[#1b253b] select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500">
                Lançamento
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-white mt-1">
                Novo serviço chegou!
              </h4>
              <p className="text-[8.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                Divulgue novos serviços, produtos e novidades da sua empresa.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-[#ff6200] px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Conhecer agora
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="85" cy="75" r="40" fill="#f43f5e" opacity="0.2" />
              <path d="M60 110 C70 90, 85 75, 105 45 C115 55, 120 70, 100 100 Z" fill="#ff6200" />
              <path d="M55 115 L70 105 L65 125 Z" fill="#ef4444" />
              <circle cx="95" cy="65" r="5" fill="#ffffff" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-[#090d17] via-transparent to-transparent" />
          </div>
        </div>
      );

    case "conteudo-educativo":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-white p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600">
                Educativo
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-zinc-900 mt-1">
                Conteúdo que gera resultados
              </h4>
              <p className="text-[8.5px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                Compartilhe conteúdos educativos e estabeleça autoridade.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-zinc-900 px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Ler material
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden flex items-center justify-center bg-amber-50/40 border-l border-zinc-200">
            <svg
              className="w-full h-full"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25 45 Q70 55 70 105 Q25 95 25 45 Z"
                fill="#fef3c7"
                stroke="#d97706"
                strokeWidth="1.5"
              />
              <path
                d="M115 45 Q70 55 70 105 Q115 95 115 45 Z"
                fill="#ffffff"
                stroke="#d97706"
                strokeWidth="1.5"
              />
              <line x1="70" y1="55" x2="70" y2="105" stroke="#b45309" strokeWidth="2" />
            </svg>
          </div>
        </div>
      );

    case "reativacao-relacionamento":
      return (
        <div
          className={cn(
            "relative flex h-36 w-full overflow-hidden rounded-xl bg-[#f8fafc] p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Reativação
              </div>
              <h4 className="text-[12px] font-extrabold leading-tight text-zinc-900 mt-1">
                Sentimos sua falta!
              </h4>
              <p className="text-[8.5px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                Reconecte-se com leads inativos e reative oportunidades.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-[#ff6200] px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Reconectar
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden flex items-center justify-center bg-slate-100 border-l border-zinc-200">
            <svg
              className="w-full h-full"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="70" cy="70" r="35" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
              <path
                d="M50 70 L65 85 L95 55"
                stroke="#ff6200"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      );

    case "meu-template-institucional":
    default:
      return (
        <div
          className={cn(
            "relative flex h-32 w-full overflow-hidden rounded-xl bg-white p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm",
            className,
          )}
        >
          <div className="flex flex-col justify-between z-10 w-3/5 pr-1">
            <div>
              <h4 className="text-[12px] font-extrabold leading-tight text-zinc-900">
                Solução completa para o seu negócio
              </h4>
              <p className="text-[8.5px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                Template próprio configurado com a identidade da sua marca.
              </p>
            </div>
            <div className="mt-2">
              <span className="inline-block rounded-md bg-[#ff6200] px-2 py-1 text-[8.5px] font-bold text-white shadow-sm">
                Conhecer Solução
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden flex items-center justify-center bg-zinc-100">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 140 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="140" height="144" fill="#e2e8f0" />
              <circle cx="70" cy="45" r="24" fill="#64748b" />
              <path d="M30 144 C30 95, 110 95, 110 144 Z" fill="#334155" />
            </svg>
          </div>
        </div>
      );
  }
}
