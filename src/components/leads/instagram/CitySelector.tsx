import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type MunicipioIbge = { id: number; nome: string };
const cacheMunicipios = new Map<string, string[]>();

export function CitySelector({
  uf,
  value,
  onChange,
  disabled,
}: {
  uf: string;
  value: string;
  onChange: (cidade: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!uf) {
      setCidades([]);
      return;
    }
    const cached = cacheMunicipios.get(uf);
    if (cached) {
      setCidades(cached);
      setErro(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setErro(false);
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`IBGE ${response.status}`);
        return (await response.json()) as MunicipioIbge[];
      })
      .then((items) => {
        if (!active) return;
        const nomes = items.map((item) => item.nome);
        cacheMunicipios.set(uf, nomes);
        setCidades(nomes);
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof DOMException && error.name === "AbortError"))
          setErro(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [uf]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || !uf || loading}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {loading
              ? "Carregando cidades…"
              : value || (uf ? "Selecione a cidade" : "Escolha a UF")}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-60" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar cidade…" />
          <CommandList>
            <CommandEmpty>
              {erro ? "Não foi possível carregar as cidades." : "Cidade não encontrada."}
            </CommandEmpty>
            <CommandGroup>
              {cidades.map((cidade) => (
                <CommandItem
                  key={cidade}
                  value={cidade}
                  onSelect={() => {
                    onChange(cidade);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("h-4 w-4", cidade === value ? "opacity-100" : "opacity-0")}
                  />
                  {cidade}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
