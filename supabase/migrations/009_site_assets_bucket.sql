-- Redesign v4 — bucket PÚBLICO de assets dos sites (imagens re-hospedadas).
-- Guarda: hero/<nicho>/*.jpg (heroes curados por nicho) e <redesign_id>/*.jpg
-- (fotos reais do Google re-hospedadas). Público para o navegador carregar as
-- imagens dos sites publicados sem hotlink de lh3.googleusercontent (que expira).
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;
