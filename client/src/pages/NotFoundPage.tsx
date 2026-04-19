import { EmptyState } from "../components/ui/EmptyState";

export const NotFoundPage = () => (
  <EmptyState
    title="Page not found"
    description="The page you’re looking for doesn’t exist in this workspace."
    actionHref="/"
    actionLabel="Back to Today"
  />
);
