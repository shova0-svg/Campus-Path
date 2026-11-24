import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for /shop and /shop/$productId. */
export const Route = createFileRoute("/shop")({
  component: () => <Outlet />,
});
