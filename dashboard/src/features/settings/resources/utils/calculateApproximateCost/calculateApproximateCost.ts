import { RESOURCE_VCPU_MULTIPLIER } from '@/utils/CONSTANTS';

/**
 * Calculate the approximate cost of a list of services.
 *
 * @param pricePerVCPU - The price of a vCPU core.
 * @param services - The list of services to calculate the cost of.
 * @returns The approximate cost of the services.
 */
export default function calculateApproximateCost(
  pricePerVCPU: number,
  ...services: { replicas?: number; vcpu?: number }[]
) {
  return (
    pricePerVCPU *
    services.reduce((total, service) => {
      if (!service.replicas || !service.vcpu) {
        return total;
      }

      return (
        total + (service.replicas * service.vcpu) / RESOURCE_VCPU_MULTIPLIER
      );
    }, 0)
  );
}
