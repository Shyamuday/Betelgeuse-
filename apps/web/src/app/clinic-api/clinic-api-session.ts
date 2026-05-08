export function assertBackendSession(token: string): void {
  if (!token) {
    throw new Error('Backend session missing. Please login again.');
  }
}
