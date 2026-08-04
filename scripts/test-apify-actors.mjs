import crypto from "crypto";

const raw = "godyJj0jT+vSWTg7mh2+++BzwK0DEi5vBbd+xpXhSWM="; // Real key from edge function
const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));

async function run() {
  const key = await crypto.webcrypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["decrypt"]);
  const k = {
    "apelido": "grupomgnetwork@gmail.com",
    "valor_cifrado": "igLORq8pG8BoTFKp/MqXceZQgccu6MRAb+dDHbDus/9fFhbPkoOQ5oa5cfjVp8FFLD9FlpIqjtSk9Ifh+fUntg7VAmOXg1n3u48="
  };

  const combo = Uint8Array.from(atob(k.valor_cifrado), (c) => c.charCodeAt(0));
  const iv = combo.slice(0, 12);
  const cifrado = combo.slice(12);
  const plano = await crypto.webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cifrado);
  const token = new TextDecoder().decode(plano);
  
  const actors = ["compass~crawler-google-places", "drobnikj~crawler-google-places", "apify~google-maps-scraper", "triemap~google-maps-scraper"];
  for (const actor of actors) {
    const res = await fetch(`https://api.apify.com/v2/acts/${actor}?token=${token}`);
    const json = await res.json();
    console.log(`Actor ${actor}: status=${res.status}, msg=${json.error?.message || "OK"}`);
  }
}
run();
