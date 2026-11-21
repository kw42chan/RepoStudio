# RepoStudio project rules

- For the Instagram Default layout pack, every slide should use the same cover layout and light appearance as slide 1 while retaining its own content.
- When a development phase finishes, mark that phase and its completed checklist items as finished in the development plan before replying. Keep unfinished phases open and include the completion date, commit, and verification results.
- After every completed app behavior, UI/style, asset, dependency or application-configuration change, execute `docs/testing/regression-smoke.md` before reporting the change verified or handing it off for review. Run `npm run test:smoke`, complete all desktop cases through agent-desktop with fresh evidence, and require `npm run test:smoke:check -- <new-run-directory>` to pass. Keep blocked/failed verification explicit. Documentation/test-tooling-only changes use appropriate focused checks. The reusable suite owns the case definitions; dated run logs own their observations.
