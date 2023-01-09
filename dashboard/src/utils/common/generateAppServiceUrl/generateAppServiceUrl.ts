import { getLocalBackendPort } from '@/utils/env';

export type NhostService =
  | 'auth'
  | 'graphql'
  | 'functions'
  | 'storage'
  | 'hasura';

/**
 * The default slugs that are used when running the dashboard locally. These
 * values are used both in local mode and when running the dashboard locally
 * against the remote (either staging or production) backend.
 */
export const defaultLocalBackendSlugs: Record<NhostService, string> = {
  auth: '/v1/auth',
  graphql: '/v1/graphql',
  functions: '/v1/functions',
  storage: '/v1/files',
  hasura: '',
};

/**
 * The default slugs that are used when running the dashboard against the
 * remote (either staging or production) backend in a cloud environment.
 */
export const defaultRemoteBackendSlugs: Record<NhostService, string> = {
  auth: '/v1',
  graphql: '/v1',
  functions: '/v1',
  storage: '/v1',
  hasura: '',
};

/**
 * Generates a service specific URL for a project. Provided `subdomain` is
 * omitted if the dashboard is running in local mode.
 *
 * @param subdomain - The project's subdomain
 * @param region - The project's region
 * @param service - The service to generate the URL for
 * @param localBackendSlugs - Custom slugs to be used when running the dashboard locally
 * @param localBackendSlugs - Custom slugs to be used when running the dashboard in a cloud environment
 * @returns The service specific URL for the project
 */
export default function generateAppServiceUrl(
  subdomain: string,
  region: string,
  service: 'auth' | 'graphql' | 'functions' | 'storage' | 'hasura',
  localBackendSlugs = defaultLocalBackendSlugs,
  remoteBackendSlugs = defaultRemoteBackendSlugs,
) {
  const LOCAL_BACKEND_PORT = getLocalBackendPort();

  // We are treating it as if NEXT_PUBLIC_NHOST_PLATFORM is true, but we need
  // to make sure to use Hasura on `localhost`
  if (subdomain && subdomain !== 'localhost' && !region) {
    if (service === 'hasura') {
      return `http://localhost:${LOCAL_BACKEND_PORT || 8080}${
        localBackendSlugs[service]
      }`;
    }

    const nhostBackend =
      process.env.NEXT_PUBLIC_ENV === 'staging'
        ? 'staging.nhost.run'
        : 'nhost.run';

    const customSubdomain =
      subdomain.startsWith('https://') || subdomain.startsWith('http://')
        ? subdomain
        : `https://${subdomain}`;

    if (LOCAL_BACKEND_PORT && LOCAL_BACKEND_PORT !== '443') {
      return `${customSubdomain}.${nhostBackend}:${LOCAL_BACKEND_PORT}${localBackendSlugs[service]}`;
    }

    return `${customSubdomain}.${nhostBackend}${localBackendSlugs[service]}`;
  }

  if (process.env.NEXT_PUBLIC_NHOST_PLATFORM !== 'true') {
    return `http://localhost:${LOCAL_BACKEND_PORT || 1337}${
      localBackendSlugs[service]
    }`;
  }

  if (process.env.NEXT_PUBLIC_ENV === 'dev') {
    return `${
      process.env.NEXT_PUBLIC_NHOST_BACKEND_URL ||
      `http://localhost:${LOCAL_BACKEND_PORT || 1337}`
    }${localBackendSlugs[service]}`;
  }

  if (process.env.NEXT_PUBLIC_ENV === 'staging') {
    return `https://${subdomain}.${service}.${region}.staging.nhost.run${remoteBackendSlugs[service]}`;
  }

  return `https://${subdomain}.${service}.${region}.nhost.run${remoteBackendSlugs[service]}`;
}
