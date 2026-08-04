import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const admin = createClient(
  "https://b8cf5f603c1b42740622fe53c00ff03bcd5c316476adb02f5a2429b7ace6d61e.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImI4Y2Y1ZjYwM2MxYjQyNzQwNjIyZmU1M2MwMGZmMDNiY2Q1YzMxNjQ3NmFkYjAyZjVhMjQyOWI3YWNlNmQ2MWUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjIwMTk2MDMyMDB9.b61b48f860632b15757533a9f32ff74dda2959a9423ef21e491c8701efe16cb6" // this is not the full service key, wait, in secrets list it shows a short hash.
);
