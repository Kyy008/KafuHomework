export const isGitHubPagesRuntime = () =>
  typeof window !== 'undefined' &&
  window.location.hostname.toLowerCase().endsWith('github.io')
