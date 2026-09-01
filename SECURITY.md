# Security

AppStore Forge runs entirely on your machine. It has no server, no accounts, no
telemetry, and makes no network requests — your screenshots never leave the
computer. That removes most of the surface a report would normally concern.

What is left worth reporting:

- Something in the Electron main process or the preload bridge that lets a page
  reach further into the filesystem than the export folder you picked.
- A dependency advisory that actually reaches shipped code.
- Anything that makes the packaged app execute content it should not.

## Reporting

Please **do not** open a public issue for a vulnerability. Use GitHub's private
reporting instead:

**[Report a vulnerability](https://github.com/hebertporto/appstore-forge/security/advisories/new)**

Include what you did, what happened, and the version (shown in the app's footer).
This is a side project maintained in spare time — expect a first reply within a
week or so, not within hours.

## Supported versions

The latest release only. There are no backports; fixes ship in the next version.

## A note on the build

Releases are **unsigned and not notarized**. macOS will ask you to confirm the
first launch, which is expected. If you would rather not trust a binary, the
build is one command from source: `pnpm install && pnpm dist`.
