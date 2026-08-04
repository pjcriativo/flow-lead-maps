import { decifrar } from "../supabase/functions/_shared/cofre.ts";

const tokenCifrado = "igLORq8pG8BoTFKp/MqXceZQgccu6MRAb+dDHbDus/9fFhbPkoOQ5oa5cfjVp8FFLD9FlpIqjtSk9Ifh+fUntg7VAmOXg1n3u48=";

async function run() {
  const token = await decifrar(tokenCifrado);
  console.log("Token começa com:", token.substring(0, 8));

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

  console.log("Status HTTP da Apify:", res.status);
  const text = await res.text();
  console.log("Resposta detalhada da Apify:", text);
}

run().catch(console.error);
