import { AppLayout } from "@/components/layout/AppLayout";
import { Providers } from "./Providers.js";
import { Router } from "./Router.js";

export function App() {
  return (
    <Providers>
      <AppLayout>
        <Router />
      </AppLayout>
    </Providers>
  );
}
