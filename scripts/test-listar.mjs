import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
let anonKey = "";
for (const line of env.split("\n")) {
  if (line.startsWith("SUPABASE_ANON_KEY=")) {
    anonKey = line.split("=")[1].trim();
    if (anonKey.startsWith('"') && anonKey.endsWith('"')) anonKey = anonKey.slice(1, -1);
  }
}

async function run() {
  const resp = await fetch("http://127.0.0.1:54321/functions/v1/admin-acoes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + anonKey,
    },
    body: JSON.stringify({ acao: "apify_pool_listar" }),
  });

  const json = await resp.json();
  console.log(JSON.stringify(json, null, 2));
}

run();
