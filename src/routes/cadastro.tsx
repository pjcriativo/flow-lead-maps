import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cadastro")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { mode: "signup" } });
  },
});
