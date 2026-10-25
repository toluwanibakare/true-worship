# Security Policy

## Supported versions

True Worship is early software (0.x). Security fixes go into the latest
release on the main branch. If you are running an older build, update to the
latest release first and check whether the issue still applies.

## Reporting a vulnerability

Do not open a public issue for a security problem. Report it privately
through GitHub's private vulnerability reporting on this repository
(Security tab, "Report a vulnerability"). Include:

- What the issue is and where it lives (file, feature, steps to reproduce)
- What an attacker could actually do with it
- The version or commit you tested on

You will get a reply confirming receipt, and we will work on a fix before
any public disclosure. Please give us reasonable time to ship the fix
before publishing details.

## Scope notes

- The app runs locally and churches' songs, schedules, and Bibles stay on
  their own machines unless they choose to sync the community songbook.
- The NDI sender publishes video on the local network only. On shared or
  public networks, treat the NDI stream like any other local broadcast:
  anyone on that network who can see NDI sources can view it.
- Dependencies are kept current, but a vulnerability in a dependency is
  still in scope for a report if it affects True Worship in practice.
