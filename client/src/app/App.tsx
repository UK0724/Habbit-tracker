import { RouterProvider } from "react-router-dom";

import { AppProviders } from "../providers/AppProviders";
import { router } from "../router";
import { useThemeInit } from "../shared/hooks/useThemeInit";

export const App = () => {
  useThemeInit();

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};
