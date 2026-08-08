import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env
  .split("\n")
  .find((l) => l.startsWith("VITE_SUPABASE_URL="))
  .split("=")[1]
  .trim();
const key = env
  .split("\n")
  .find((l) => l.startsWith("SUPABASE_SERVICE_ROLE_KEY="))
  .split("=")[1]
  .trim();

const supabase = createClient(url, key);

async function reset() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    "087205c1-4243-47d1-86fb-bcbdeb3c8e44",
    { password: "marcos@@25gm" },
  );
  if (error) {
    console.error("Erro:", error);
  } else {
    console.log("Senha do super admin alterada com sucesso de volta para: marcos@@25gm");
  }
}

reset();
