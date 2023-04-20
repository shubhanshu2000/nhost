import { useDialog } from '@/components/common/DialogProvider';
import Form from '@/components/common/Form';
import SettingsContainer from '@/components/settings/SettingsContainer';
import ResourcesConfirmationDialog from '@/components/settings/resources/ResourcesConfirmationDialog';
import ServiceResourcesFormFragment from '@/components/settings/resources/ServiceResourcesFormFragment';
import TotalResourcesFormFragment from '@/components/settings/resources/TotalResourcesFormFragment';
import { calculateApproximateCost } from '@/features/settings/resources/utils/calculateApproximateCost';
import { prettifyMemory } from '@/features/settings/resources/utils/prettifyMemory';
import { prettifyVCPU } from '@/features/settings/resources/utils/prettifyVCPU';
import type { ResourceSettingsFormValues } from '@/features/settings/resources/utils/resourceSettingsValidationSchema';
import { resourceSettingsValidationSchema } from '@/features/settings/resources/utils/resourceSettingsValidationSchema';
import { useProPlan } from '@/hooks/common/useProPlan';
import { useCurrentWorkspaceAndProject } from '@/hooks/v2/useCurrentWorkspaceAndProject';
import { Alert } from '@/ui/Alert';
import ActivityIndicator from '@/ui/v2/ActivityIndicator';
import Box from '@/ui/v2/Box';
import Divider from '@/ui/v2/Divider';
import { RESOURCE_VCPU_PRICE } from '@/utils/CONSTANTS';
import type { GetResourcesQuery } from '@/utils/__generated__/graphql';
import {
  GetResourcesDocument,
  useGetResourcesQuery,
  useUpdateConfigMutation,
} from '@/utils/__generated__/graphql';
import getServerError from '@/utils/settings/getServerError';
import getUnallocatedResources from '@/utils/settings/getUnallocatedResources';
import { getToastStyleProps } from '@/utils/settings/settingsConstants';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { twMerge } from 'tailwind-merge';
import ResourcesFormFooter from './ResourcesFormFooter';

function getInitialServiceResources(
  data: GetResourcesQuery,
  service: Exclude<keyof GetResourcesQuery['config'], '__typename'>,
) {
  const { cpu, memory } = data?.config?.[service]?.resources?.compute || {};

  return {
    replicas: 1,
    vcpu: cpu || 0,
    memory: memory || 0,
  };
}

export default function ResourcesForm() {
  const [validationError, setValidationError] = useState<Error | null>(null);

  const { openDialog, closeDialog } = useDialog();
  const { currentProject } = useCurrentWorkspaceAndProject();

  const {
    data,
    loading,
    error: resourcesError,
  } = useGetResourcesQuery({
    variables: {
      appId: currentProject?.id,
    },
  });

  const {
    data: proPlan,
    loading: proPlanLoading,
    error: proPlanError,
  } = useProPlan();

  const [updateConfig] = useUpdateConfigMutation({
    refetchQueries: [GetResourcesDocument],
  });

  const initialDatabaseResources = getInitialServiceResources(data, 'postgres');
  const initialHasuraResources = getInitialServiceResources(data, 'hasura');
  const initialAuthResources = getInitialServiceResources(data, 'auth');
  const initialStorageResources = getInitialServiceResources(data, 'storage');

  const totalInitialVCPU =
    initialDatabaseResources.vcpu +
    initialHasuraResources.vcpu +
    initialAuthResources.vcpu +
    initialStorageResources.vcpu;

  const totalInitialMemory =
    initialDatabaseResources.memory +
    initialHasuraResources.memory +
    initialAuthResources.memory +
    initialStorageResources.memory;

  const form = useForm<ResourceSettingsFormValues>({
    values: {
      enabled: totalInitialVCPU > 0 && totalInitialMemory > 0,
      totalAvailableVCPU: totalInitialVCPU || 2000,
      totalAvailableMemory: totalInitialMemory || 4096,
      database: {
        replicas: initialDatabaseResources.replicas || 1,
        vcpu: initialDatabaseResources.vcpu || 1000,
        memory: initialDatabaseResources.memory || 2048,
      },
      hasura: {
        replicas: initialHasuraResources.replicas || 1,
        vcpu: initialHasuraResources.vcpu || 500,
        memory: initialHasuraResources.memory || 1536,
      },
      auth: {
        replicas: initialAuthResources.replicas || 1,
        vcpu: initialAuthResources.vcpu || 250,
        memory: initialAuthResources.memory || 256,
      },
      storage: {
        replicas: initialStorageResources.replicas || 1,
        vcpu: initialStorageResources.vcpu || 250,
        memory: initialStorageResources.memory || 256,
      },
    },
    resolver: yupResolver(resourceSettingsValidationSchema),
  });

  if (!proPlan && !proPlanLoading) {
    return (
      <Alert severity="error">
        Couldn&apos;t load the plan for this project. Please try again.
      </Alert>
    );
  }

  if (loading || proPlanLoading) {
    return (
      <ActivityIndicator
        label="Loading resource settings..."
        delay={1000}
        className="mx-auto"
      />
    );
  }

  const { watch, formState } = form;
  const isDirty = Object.keys(formState.dirtyFields).length > 0;

  const enabled = watch('enabled');

  const initialPrice =
    proPlan.price +
    calculateApproximateCost(
      RESOURCE_VCPU_PRICE,
      {
        replicas: initialDatabaseResources.replicas,
        vcpu: initialDatabaseResources.vcpu,
      },
      {
        replicas: initialHasuraResources.replicas,
        vcpu: initialHasuraResources.vcpu,
      },
      {
        replicas: initialAuthResources.replicas,
        vcpu: initialAuthResources.vcpu,
      },
      {
        replicas: initialStorageResources.replicas,
        vcpu: initialStorageResources.vcpu,
      },
    );

  async function handleSubmit(formValues: ResourceSettingsFormValues) {
    const updateConfigPromise = updateConfig({
      variables: {
        appId: currentProject?.id,
        config: {
          postgres: {
            resources: formValues.enabled
              ? {
                  compute: {
                    cpu: formValues.database?.vcpu,
                    memory: formValues.database?.memory,
                  },
                  replicas: 1,
                }
              : null,
          },
          hasura: {
            resources: formValues.enabled
              ? {
                  compute: {
                    cpu: formValues.hasura?.vcpu,
                    memory: formValues.hasura?.memory,
                  },
                  replicas: 1,
                }
              : null,
          },
          auth: {
            resources: formValues.enabled
              ? {
                  compute: {
                    cpu: formValues.auth?.vcpu,
                    memory: formValues.auth?.memory,
                  },
                  replicas: 1,
                }
              : null,
          },
          storage: {
            resources: formValues.enabled
              ? {
                  compute: {
                    cpu: formValues.storage?.vcpu,
                    memory: formValues.storage?.memory,
                  },
                  replicas: 1,
                }
              : null,
          },
        },
      },
    });

    try {
      await toast.promise(
        updateConfigPromise,
        {
          loading: 'Updating resources...',
          success: 'Resources have been updated successfully.',
          error: getServerError(
            'An error occurred while updating resources. Please try again.',
          ),
        },
        getToastStyleProps(),
      );

      if (!formValues.enabled) {
        form.reset({
          enabled: false,
          totalAvailableVCPU: 2000,
          totalAvailableMemory: 4096,
          database: {
            replicas: 1,
            vcpu: 1000,
            memory: 2048,
          },
          hasura: {
            replicas: 1,
            vcpu: 500,
            memory: 1536,
          },
          auth: {
            replicas: 1,
            vcpu: 250,
            memory: 256,
          },
          storage: {
            replicas: 1,
            vcpu: 250,
            memory: 256,
          },
        });
      } else {
        form.reset(null, { keepValues: true, keepDirty: false });
      }
    } catch {
      // Note: The error has already been handled by the toast.
    }
  }

  function handleConfirm(formValues: ResourceSettingsFormValues) {
    setValidationError(null);

    const { vcpu: unallocatedVCPU, memory: unallocatedMemory } =
      getUnallocatedResources(formValues);
    const hasUnusedResources = unallocatedVCPU > 0 || unallocatedMemory > 0;

    if (hasUnusedResources) {
      const unusedResourceMessage = [
        unallocatedVCPU > 0 ? `${prettifyVCPU(unallocatedVCPU)} vCPUs` : '',
        unallocatedMemory > 0
          ? `${prettifyMemory(unallocatedMemory)} of Memory`
          : '',
      ]
        .filter(Boolean)
        .join(' and ');

      setValidationError(
        new Error(
          `You now have ${unusedResourceMessage} unused. Allocate it to any of the services before saving.`,
        ),
      );

      return;
    }

    openDialog({
      title: formValues.enabled
        ? 'Confirm Dedicated Resources'
        : 'Disable Dedicated Resources',
      component: (
        <ResourcesConfirmationDialog
          updatedResources={{
            vcpu: formValues.enabled ? formValues.totalAvailableVCPU : 0,
            memory: formValues.enabled ? formValues.totalAvailableMemory : 0,
          }}
          onCancel={closeDialog}
          onSubmit={async () => {
            await handleSubmit(formValues);
          }}
        />
      ),
      props: {
        titleProps: { className: 'justify-center pb-1' },
      },
    });
  }

  if (resourcesError || proPlanError) {
    throw resourcesError || proPlanError;
  }

  return (
    <FormProvider {...form}>
      <Form onSubmit={handleConfirm}>
        <SettingsContainer
          title="Compute Resources"
          description="See how much compute you have available and customise allocation on this page."
          className="gap-0 px-0"
          showSwitch
          switchId="enabled"
          slotProps={{
            submitButton: {
              disabled: !enabled || !isDirty,
              loading: formState.isSubmitting,
            },
            // Note: We need a custom footer because of the pricing
            // information
            footer: { className: 'hidden', 'aria-hidden': true },
          }}
        >
          {enabled ? (
            <>
              <TotalResourcesFormFragment initialPrice={initialPrice} />
              <Divider />
              <ServiceResourcesFormFragment
                title="PostgreSQL Database"
                description="Manage how much compute you need for the PostgreSQL Database."
                serviceKey="database"
              />
              <Divider />
              <ServiceResourcesFormFragment
                title="Hasura GraphQL"
                description="Manage how much compute you need for the Hasura GraphQL API."
                serviceKey="hasura"
              />
              <Divider />
              <ServiceResourcesFormFragment
                title="Auth"
                description="Manage how much compute you need for Auth."
                serviceKey="auth"
              />
              <Divider />
              <ServiceResourcesFormFragment
                title="Storage"
                description="Manage how much compute you need for Storage."
                serviceKey="storage"
              />
              {validationError && (
                <Box className="px-4 pb-4">
                  <Alert
                    severity="error"
                    className="flex flex-col gap-2 text-left"
                  >
                    <strong>
                      Please use all the available vCPUs and Memory
                    </strong>

                    <p>{validationError.message}</p>
                  </Alert>
                </Box>
              )}
            </>
          ) : (
            <Box className={twMerge('px-4', 'pb-4')}>
              <Alert className="text-left">
                Enable this feature to access custom resource allocation for
                your services.
              </Alert>
            </Box>
          )}

          <ResourcesFormFooter />
        </SettingsContainer>
      </Form>
    </FormProvider>
  );
}
