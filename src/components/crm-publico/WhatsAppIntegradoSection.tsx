import {
  CheckCircle2,
  ArrowRight,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Send,
  MoreVertical,
} from "lucide-react";

export function WhatsAppIntegradoSection() {
  return (
    <section id="whatsapp-integrado" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* LADO ESQUERDO: Textos, Checklist e Botão */}
        <div className="lg:col-span-5 text-left">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
            WHATSAPP INTEGRADO
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Atendimento e vendas{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff4500]">
              no automático.
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed font-normal">
            Conecte seu WhatsApp, organize conversas, dispare mensagens e transforme contatos em clientes diretamente no Flow Business.
          </p>

          <ul className="space-y-3.5 my-8 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#ff6200] shrink-0" />
              <span>Caixa de entrada unificada</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#ff6200] shrink-0" />
              <span>Respostas automáticas com IA</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#ff6200] shrink-0" />
              <span>Organização por etiquetas</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#ff6200] shrink-0" />
              <span>Conversões direto no CRM</span>
            </li>
          </ul>

          <div className="mt-8">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff6200] px-7 py-3.5 text-base font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] hover:bg-[#e05600] hover:shadow-[0_0_30px_rgba(255,98,0,0.5)] transition-all"
            >
              Conhecer o WhatsApp <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* LADO DIREITO: Mockup de WhatsApp Web com 3 Colunas */}
        <div className="lg:col-span-7 relative">
          <div className="relative rounded-2xl md:rounded-3xl border-2 border-[#ff6200]/50 bg-[#070b11] shadow-[0_0_40px_rgba(255,98,0,0.25)] overflow-hidden">
            {/* Top Bar do Mockup */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0a0f18] px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-bold text-white text-xs">WhatsApp Business</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Search className="h-3.5 w-3.5" />
                <MoreVertical className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* 3 Colunas do WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-12 h-[380px]">
              {/* Coluna 1: Lista de Conversas (4 colunas) */}
              <div className="sm:col-span-4 border-r border-white/[0.08] bg-[#080d16] p-2 flex flex-col justify-between overflow-hidden">
                <div>
                  {/* Filtros de Status */}
                  <div className="flex items-center gap-1 pb-2 border-b border-white/5 text-[9px] text-slate-400 overflow-x-auto scrollbar-none">
                    <span className="px-1.5 py-0.5 rounded bg-[#ff6200] text-white font-bold">Todas</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5">Não lidas</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5">Aguardando</span>
                  </div>

                  {/* Lista de Contatos */}
                  <div className="space-y-1 mt-2">
                    <div className="p-1.5 rounded-lg bg-[#ff6200]/15 border border-[#ff6200]/30 cursor-pointer">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-white truncate">Clínica Vida</span>
                        <span className="text-[8px] text-[#ff7a00]">10:34</span>
                      </div>
                      <p className="text-[9px] text-slate-300 truncate">Olá! Gostaria de mais info...</p>
                    </div>

                    <div className="p-1.5 rounded-lg bg-white/[0.02] border border-transparent hover:bg-white/5 cursor-pointer">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-slate-200 truncate">Studio Fitness</span>
                        <span className="text-[8px] text-slate-500">09:18</span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">Quero agendar uma visita</p>
                    </div>

                    <div className="p-1.5 rounded-lg bg-white/[0.02] border border-transparent hover:bg-white/5 cursor-pointer">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-slate-200 truncate">Casa & Decor</span>
                        <span className="text-[8px] text-slate-500">Ontem</span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">Vocês fazem orçamento?</p>
                    </div>

                    <div className="p-1.5 rounded-lg bg-white/[0.02] border border-transparent hover:bg-white/5 cursor-pointer">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-slate-200 truncate">Mundo Pet</span>
                        <span className="text-[8px] text-slate-500">Ontem</span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">Tem planos mensais?</p>
                    </div>

                    <div className="p-1.5 rounded-lg bg-white/[0.02] border border-transparent hover:bg-white/5 cursor-pointer">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-slate-200 truncate">Construtora Alfa</span>
                        <span className="text-[8px] text-slate-500">Hoje</span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">Quero uma proposta</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Chat Aberto (5 colunas) */}
              <div className="sm:col-span-5 border-r border-white/[0.08] bg-[#05080e] p-2.5 flex flex-col justify-between">
                {/* Cabeçalho do Chat */}
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[9px] font-bold text-white">
                    CV
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">Clínica Vida</p>
                    <p className="text-[8px] text-emerald-400">Online</p>
                  </div>
                </div>

                {/* Mensagens do Chat */}
                <div className="space-y-2 my-auto text-[9px] overflow-hidden">
                  {/* Mensagem Recebida */}
                  <div className="bg-[#101726] p-2 rounded-xl rounded-tl-none border border-white/5 text-slate-200 max-w-[90%]">
                    Olá! Gostaria de mais informações sobre os planos para clínicas.
                  </div>

                  {/* Mensagem Enviada */}
                  <div className="bg-[#ff6200]/20 border border-[#ff6200]/30 p-2 rounded-xl rounded-tr-none text-white ml-auto max-w-[90%]">
                    Olá! Claro! Vou te enviar todas as informações dos nossos planos.
                  </div>

                  {/* Mensagem Recebida */}
                  <div className="bg-[#101726] p-2 rounded-xl rounded-tl-none border border-white/5 text-slate-200 max-w-[90%]">
                    Perfeito! Pode me enviar?
                  </div>

                  {/* Card Anexo PDF Enviado */}
                  <div className="bg-[#ff6200]/20 border border-[#ff6200]/30 p-2 rounded-xl rounded-tr-none text-white ml-auto max-w-[90%] flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-[#ff6200] text-white flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 text-[8px]">
                      <p className="font-bold truncate">Apresentação Flow Business.pdf</p>
                      <p className="text-slate-300">2.4 MB</p>
                    </div>
                  </div>
                </div>

                {/* Input do Chat */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center gap-1.5">
                  <div className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[9px] text-slate-400">
                    Digite uma mensagem...
                  </div>
                  <button className="h-6 w-6 rounded-lg bg-[#ff6200] text-white flex items-center justify-center shrink-0">
                    <Send className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              {/* Coluna 3: Detalhes do Lead (3 colunas) */}
              <div className="hidden sm:flex sm:col-span-3 bg-[#080d16] p-2.5 flex-col justify-between text-[10px]">
                <div>
                  <span className="font-bold text-white text-[10px] block mb-2">Detalhes do Lead</span>
                  <div className="text-center my-2">
                    <div className="h-10 w-10 mx-auto rounded-full bg-gradient-to-tr from-[#ff6200] to-[#ffa040] p-0.5 mb-1">
                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs">
                        CV
                      </div>
                    </div>
                    <p className="font-bold text-white truncate">Clínica Vida</p>
                    <p className="text-[8px] text-slate-400">Odontologia</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold">
                      Em negociação
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-3 text-[9px] text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="h-2.5 w-2.5 text-[#ff6200]" />
                      <span className="truncate">(11) 98765-4321</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="h-2.5 w-2.5 text-[#ff6200]" />
                      <span className="truncate">contato@clinicavida.com</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="h-2.5 w-2.5 text-[#ff6200]" />
                      <span className="truncate">São Paulo - SP</span>
                    </div>
                  </div>
                </div>

                <a
                  href="/pricing"
                  className="w-full text-center py-1.5 rounded-lg bg-[#ff6200] text-[9px] font-bold text-white shadow-sm hover:bg-[#e05600] transition-colors"
                >
                  Adicionar ao CRM
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

