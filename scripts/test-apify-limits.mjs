import crypto from "crypto";

const raw = "godyJj0jT+vSWTg7mh2+++BzwK0DEi5vBbd+xpXhSWM="; // Real key from edge function
const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));

async function run() {
  const key = await crypto.webcrypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["decrypt"]);
  
  const chaves = [
    {
      "apelido": "grupomgnetwork@gmail.com",
      "valor_cifrado": "igLORq8pG8BoTFKp/MqXceZQgccu6MRAb+dDHbDus/9fFhbPkoOQ5oa5cfjVp8FFLD9FlpIqjtSk9Ifh+fUntg7VAmOXg1n3u48="
    },
    {
      "apelido": "ultraimplantes2@gmail.com",
      "valor_cifrado": "eQZvgpYKDDV2mDu9DfOtYIrw1DQQVeSD8vgnr84csubGHJNiGBS+he/tHJanLGCm+UmSXT8EOrdyXasnCdjyxKVOCyfc9e/mxTk="
    },
    {
      "apelido": "plrchurch@gmail.com",
      "valor_cifrado": "/uLY95G77jC08mEfxhtH0QnrIuJj5gHtRgH74kNLitvfA6CvKLKxp+xRds6d6oVkPS55bcJLshfN+vlDbnET5ikb1Mazm74A1GY="
    },
    {
      "apelido": "mgnetworksolucoesti@gmail.com",
      "valor_cifrado": "f0HcRAQ2qFkYoaVWZYnlkg0Cxwqe4Ga2yBgbmClw88eHAPVHJE3aWOuSvE4sa7WVAr2Cw+cBMRAYSFgesIhcnpUySAjoffhUbNA="
    }
  ];

  for (const k of chaves) {
    const combo = Uint8Array.from(atob(k.valor_cifrado), (c) => c.charCodeAt(0));
    const iv = combo.slice(0, 12);
    const cifrado = combo.slice(12);
    const plano = await crypto.webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cifrado);
    const token = new TextDecoder().decode(plano);
    
    const res = await fetch(`https://api.apify.com/v2/users/me/limits?token=${token}`);
    const json = await res.json();
    console.log(`Key ${k.apelido}: maxMonthlyUsageUsd=${json.data?.limits?.maxMonthlyUsageUsd}, currentMonthlyUsageUsd=${json.data?.current?.monthlyUsageUsd}`);
  }
}
run();
