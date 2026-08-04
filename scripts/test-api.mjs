const url = "https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/test-apify";
const b = {
  token_cifrado: "igLORq8pG8BoTFKp/MqXceZQgccu6MRAb+dDHbDus/9fFhbPkoOQ5oa5cfjVp8FFLD9FlpIqjtSk9Ifh+fUntg7VAmOXg1n3u48="
};

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(b)
}).then(res => res.json()).then(console.log).catch(console.error);
