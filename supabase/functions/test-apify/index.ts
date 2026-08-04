import { decifrar } from "../_shared/cofre.ts";

Deno.serve(async (req) => {
  try {
    const b = await req.json();
    const tokenCifrado = b.token_cifrado;
    if (!tokenCifrado) return new Response(JSON.stringify({ error: "sem token cifrado" }), { status: 400 });

    const token = await decifrar(tokenCifrado);

    const runInput = {
      searchStringsArray: ["restaurantes em sao paulo"],
      maxCrawledPlacesPerSearch: 1,
      language: "pt-BR"
    };

    const apifyUrl = `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${encodeURIComponent(token)}`;
    
    const res = await fetch(apifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(runInput)
    });

    const text = await res.text();
    return new Response(JSON.stringify({ status: res.status, body: text, tokenStarts: token.substring(0, 4) }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
