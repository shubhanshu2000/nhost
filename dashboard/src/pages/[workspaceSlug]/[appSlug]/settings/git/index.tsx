import Container from '@/components/layout/Container';
import SettingsLayout from '@/components/settings/SettingsLayout';
import { BaseDirectorySettings } from '@/features/git/settings/components/BaseDirectorySettings';
import { DeploymentBranchSettings } from '@/features/git/settings/components/DeploymentBranchSettings';
import { GitConnectionSettings } from '@/features/git/settings/components/GitConnectionSettings';
import type { ReactElement } from 'react';

export default function GitSettingsPage() {
  return (
    <Container
      className="grid max-w-5xl grid-flow-row gap-y-6 bg-transparent"
      rootClassName="bg-transparent"
    >
      <GitConnectionSettings />
      <DeploymentBranchSettings />
      <BaseDirectorySettings />
    </Container>
  );
}

GitSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <SettingsLayout>{page}</SettingsLayout>;
};
