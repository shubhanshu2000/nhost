import { Container } from '@/components/layout/Container';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { DatabaseConnectionInfo } from '@/features/database/settings/components/DatabaseConnectionInfo';
import { DatabaseServiceVersionSettings } from '@/features/database/settings/components/DatabaseServiceVersionSettings';
import { ResetDatabasePasswordSettings } from '@/features/database/settings/components/ResetDatabasePasswordSettings';
import { useCurrentWorkspaceAndProject } from '@/features/projects/hooks/useCurrentWorkspaceAndProject';
import { useGetPostgresSettingsQuery } from '@/generated/graphql';
import { ActivityIndicator } from '@/ui/v2/ActivityIndicator';
import type { ReactElement } from 'react';

export default function DatabaseSettingsPage() {
  const { currentProject } = useCurrentWorkspaceAndProject();

  const { loading, error } = useGetPostgresSettingsQuery({
    variables: { appId: currentProject?.id },
    skip: !currentProject,
  });

  if (loading) {
    return (
      <ActivityIndicator
        delay={1000}
        label="Loading Postgres settings..."
        className="justify-center"
      />
    );
  }

  if (error) {
    throw error;
  }

  return (
    <Container
      className="grid max-w-5xl grid-flow-row gap-y-6 bg-transparent"
      rootClassName="bg-transparent"
    >
      <DatabaseServiceVersionSettings />
      <DatabaseConnectionInfo />
      <ResetDatabasePasswordSettings />
    </Container>
  );
}

DatabaseSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <SettingsLayout>{page}</SettingsLayout>;
};
