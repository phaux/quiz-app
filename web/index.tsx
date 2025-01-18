/// <reference lib="dom" />
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { BrowserRouter } from "react-router";
import { IntlProvider } from "react-intl";

createRoot(document.body).render(
  <BrowserRouter>
    <IntlProvider locale="pl">
      <App />
    </IntlProvider>
  </BrowserRouter>
);

setTimeout(() => {
  if (!document.hasFocus()) location.reload();
}, 5000);
