// Runtime twin of identity.dev.ts. cursor/identity.ts imports this .js path.
// Keep the two files in sync. This viewer is simulated and only used on a local dev server.

export const DEV_VIEWER = {
  sub: "user:dev",
  email: "dev@example.com",
  name: "Dev Viewer",
  teamId: 1,
  teamRole: "admin",
};
