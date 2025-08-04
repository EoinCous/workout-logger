export const handleSupabaseAuthError = (err, logout) => {
  if (!err) return false;

  const isAuthFailure =
    err.status === 401 ||
    (err.message && err.message.toLowerCase().includes('row-level security policy')) ||
    (err.message && err.message.toLowerCase().includes('not authenticated'));

  if (isAuthFailure) {
    // force sign out / clear context
    logout().catch(() => {});
  }
};