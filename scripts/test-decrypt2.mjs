import crypto from "crypto";

const raw = "godyJj0jT+vSWTg7mh2+++BzwK0DEi5vBbd+xpXhSWM="; // Real key from edge function
const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));

async function run() {
  const key = await crypto.webcrypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["decrypt"]);

  const chaves = [
    {
      "id": "34916f6d-826b-4945-ae01-ddbaebb6ae08",
      "apelido": "grupomgnetwork@gmail.com",
      "valor_cifrado": "igLORq8pG8BoTFKp/MqXceZQgccu6MRAb+dDHbDus/9fFhbPkoOQ5oa5cfjVp8FFLD9FlpIqjtSk9Ifh+fUntg7VAmOXg1n3u48="
    },
    {
      "id": "80b26f4a-83c6-4166-b7d0-148bf5f1d24f",
      "apelido": "ultraimplantes2@gmail.com",
      "valor_cifrado": "eQZvgpYKDDV2mDu9DfOtYIrw1DQQVeSD8vgnr84csubGHJNiGBS+he/tHJanLGCm+UmSXT8EOrdyXasnCdjyxKVOCyfc9e/mxTk="
    }
  ];

  for (const k of chaves) {
    try {
      const combo = Uint8Array.from(atob(k.valor_cifrado), (c) => c.charCodeAt(0));
      const iv = combo.slice(0, 12);
      const cifrado = combo.slice(12);
      const plano = await crypto.webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cifrado);
      const token = new TextDecoder().decode(plano);
      console.log(`Key ${k.apelido}: Successfully decrypted (token length ${token.length})`);
    } catch (e) {
      console.log(`Key ${k.apelido}: Failed to decrypt - ${e.message}`);
    }
  }
}
run();
