import { prettifyMemory } from '@/features/settings/resources/utils/prettifyMemory';
import { prettifyVCPU } from '@/features/settings/resources/utils/prettifyVCPU';
import type { ResourceSettingsFormValues } from '@/features/settings/resources/utils/resourceSettingsValidationSchema';
import {
  MAX_SERVICE_MEMORY,
  MAX_SERVICE_REPLICAS,
  MAX_SERVICE_VCPU,
  MIN_SERVICE_MEMORY,
  MIN_SERVICE_REPLICAS,
  MIN_SERVICE_VCPU,
} from '@/features/settings/resources/utils/resourceSettingsValidationSchema';
import Box from '@/ui/v2/Box';
import Slider from '@/ui/v2/Slider';
import Text from '@/ui/v2/Text';
import Tooltip from '@/ui/v2/Tooltip';
import { ExclamationIcon } from '@/ui/v2/icons/ExclamationIcon';
import { RESOURCE_MEMORY_STEP, RESOURCE_VCPU_STEP } from '@/utils/CONSTANTS';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

export interface ServiceResourcesFormFragmentProps {
  /**
   * The title of the form fragment.
   */
  title: string;
  /**
   * The description of the form fragment.
   */
  description: string;
  /**
   * Form field name for service.
   */
  serviceKey: Exclude<
    keyof ResourceSettingsFormValues,
    'enabled' | 'totalAvailableVCPU' | 'totalAvailableMemory'
  >;
}

export default function ServiceResourcesFormFragment({
  title,
  description,
  serviceKey,
}: ServiceResourcesFormFragmentProps) {
  const { setValue } = useFormContext<ResourceSettingsFormValues>();
  const formState = useFormState<ResourceSettingsFormValues>();
  const formValues = useWatch<ResourceSettingsFormValues>();
  const serviceValues = formValues[serviceKey];

  // Total allocated CPU for all resources
  const totalAllocatedVCPU = Object.keys(formValues)
    .filter(
      (key) =>
        !['enabled', 'totalAvailableVCPU', 'totalAvailableMemory'].includes(
          key,
        ),
    )
    .reduce((acc, key) => acc + formValues[key].vcpu, 0);

  // Total allocated memory for all resources
  const totalAllocatedMemory = Object.keys(formValues)
    .filter(
      (key) =>
        !['enabled', 'totalAvailableVCPU', 'totalAvailableMemory'].includes(
          key,
        ),
    )
    .reduce((acc, key) => acc + formValues[key].memory, 0);

  const remainingVCPU = formValues.totalAvailableVCPU - totalAllocatedVCPU;
  const allowedVCPU = remainingVCPU + serviceValues.vcpu;

  const remainingMemory =
    formValues.totalAvailableMemory - totalAllocatedMemory;
  const allowedMemory = remainingMemory + serviceValues.memory;

  function handleCPUChange(value: string) {
    const updatedVCPU = parseFloat(value);
    const exceedsAvailableVCPU =
      updatedVCPU + (totalAllocatedVCPU - serviceValues.vcpu) >
      formValues.totalAvailableVCPU;

    if (
      Number.isNaN(updatedVCPU) ||
      exceedsAvailableVCPU ||
      updatedVCPU < MIN_SERVICE_VCPU
    ) {
      return;
    }

    setValue(`${serviceKey}.vcpu`, updatedVCPU, { shouldDirty: true });
  }

  function handleMemoryChange(value: string) {
    const updatedMemory = parseFloat(value);
    const exceedsAvailableMemory =
      updatedMemory + (totalAllocatedMemory - serviceValues.memory) >
      formValues.totalAvailableMemory;

    if (
      Number.isNaN(updatedMemory) ||
      exceedsAvailableMemory ||
      updatedMemory < MIN_SERVICE_MEMORY
    ) {
      return;
    }

    setValue(`${serviceKey}.memory`, updatedMemory, { shouldDirty: true });
  }

  return (
    <Box className="grid grid-flow-row gap-4 p-4">
      <Box className="grid grid-flow-row gap-2">
        <Text variant="h3" className="font-semibold">
          {title}
        </Text>

        <Text color="secondary">{description}</Text>
      </Box>

      <Box className="grid grid-flow-row gap-2">
        <Text>
          Replicas:{' '}
          <span className="font-medium">{serviceValues.replicas}</span>
        </Text>

        <Slider
          value={serviceValues.replicas}
          onChange={(_event, value) => {
            if (Array.isArray(value)) {
              if (value[0] < MIN_SERVICE_REPLICAS) {
                return;
              }

              setValue(`${serviceKey}.replicas`, value[0], {
                shouldDirty: true,
              });

              return;
            }

            if (value < MIN_SERVICE_REPLICAS) {
              return;
            }

            setValue(`${serviceKey}.replicas`, value, { shouldDirty: true });
          }}
          min={0}
          max={MAX_SERVICE_REPLICAS}
          step={1}
          aria-label={`${title} Replicas`}
          marks
        />
      </Box>

      <Box className="grid grid-flow-row gap-2">
        <Box className="grid grid-flow-col items-center justify-between gap-2">
          <Text>
            Allocated vCPUs:{' '}
            <span className="font-medium">
              {prettifyVCPU(serviceValues.vcpu)}
            </span>
          </Text>

          {remainingVCPU > 0 && serviceValues.vcpu < MAX_SERVICE_VCPU && (
            <Text className="text-sm">
              <span className="font-medium">
                {prettifyVCPU(remainingVCPU)} vCPUs
              </span>{' '}
              remaining
            </Text>
          )}
        </Box>

        <Slider
          value={serviceValues.vcpu}
          onChange={(_event, value) => handleCPUChange(value.toString())}
          max={MAX_SERVICE_VCPU}
          step={RESOURCE_VCPU_STEP}
          allowed={allowedVCPU}
          aria-label={`${title} vCPU`}
          marks
        />
      </Box>

      <Box className="grid grid-flow-row gap-2">
        <Box className="grid grid-flow-col items-center justify-between gap-2">
          <Box className="grid grid-flow-col items-center justify-start gap-2">
            <Text
              color={
                formState.errors?.[serviceKey]?.message ? 'error' : 'primary'
              }
            >
              Allocated Memory:{' '}
              <span className="font-medium">
                {prettifyMemory(serviceValues.memory)}
              </span>
            </Text>

            {formState.errors?.[serviceKey]?.message ? (
              <Tooltip title={formState.errors[serviceKey].message}>
                <ExclamationIcon color="error" className="h-4 w-4" />
              </Tooltip>
            ) : null}
          </Box>

          {remainingMemory > 0 && serviceValues.memory < MAX_SERVICE_MEMORY && (
            <Text className="text-sm">
              <span className="font-medium">
                {prettifyMemory(remainingMemory)} of Memory
              </span>{' '}
              remaining
            </Text>
          )}
        </Box>

        <Slider
          value={serviceValues.memory}
          onChange={(_event, value) => handleMemoryChange(value.toString())}
          max={MAX_SERVICE_MEMORY}
          step={RESOURCE_MEMORY_STEP}
          allowed={allowedMemory}
          aria-label={`${title} Memory`}
          marks
        />
      </Box>
    </Box>
  );
}
