import { useCurrentWorkspaceAndProject } from '@/features/projects/hooks/useCurrentWorkspaceAndProject';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * Redirects to 404 page if either currentWorkspace/currentProject resolves to undefined.
 */
export default function useNotFoundRedirect() {
  const router = useRouter();
  const {
    query: { workspaceSlug, appSlug, updating },
    isReady,
  } = router;

  const { currentProject, currentWorkspace, loading } =
    useCurrentWorkspaceAndProject();

  useEffect(() => {
    if (
      // If we're updating, we don't want to redirect to 404
      updating ||
      // If the router is not ready, we don't want to redirect to 404
      !isReady ||
      // If the current workspace and project are not loaded, we don't want to redirect to 404
      loading ||
      // If we're already on the 404 page, we don't want to redirect to 404
      router.pathname === '/404' ||
      // If we are on a valid workspace and project, we don't want to redirect to 404
      (workspaceSlug && currentWorkspace && appSlug && currentProject) ||
      // If we are on a valid workspace and no project is selected, we don't want to redirect to 404
      (workspaceSlug && currentWorkspace && !appSlug && !currentProject)
    ) {
      return;
    }

    router.replace('/404');
  }, [
    currentProject,
    currentWorkspace,
    isReady,
    loading,
    appSlug,
    router,
    updating,
    workspaceSlug,
  ]);
}
