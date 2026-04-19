import { jsx as _jsx } from "react/jsx-runtime";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "../providers/AppProviders";
import { router } from "../router";
export const App = () => (_jsx(AppProviders, { children: _jsx(RouterProvider, { router: router }) }));
