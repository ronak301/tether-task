# AI Usage

## Tool

**Claude Code (Anthropic)** — used throughout via the CLI directly in the terminal.

---

## How It Was Used

AI was used as a collaborative engineering partner, not as an autonomous code generator. Every significant piece of work followed a deliberate sequence before any code was written.

### Process Per Feature

1. **HLD first** — discussed the high-level design: what the feature needs to do, which WDK hooks are involved, what the screen flow looks like, where the boundaries sit between SDK and app layer.

2. **LLD** — once the HLD was agreed, drilled into implementation specifics: data flow, state shape, hook wiring, edge cases.

3. **Security review** — before coding started, discussed any security implications: what data is being passed where, whether anything sensitive touches navigation params or local state, whether any auth gate could be bypassed.

4. **UI/UX review** — reviewed the proposed screen layout and interactions before implementation, referencing the Tether production app as the design reference.

5. **Implementation** — only after all four steps were signed off did AI begin writing or modifying code.

Claude Code's **plan mode** was used at the start of each significant task. This produces an explicit written plan that can be reviewed and corrected before any files are touched — preventing large rewrites from wrong assumptions.

---

## What Was Discussed (Not Just Generated)

- WDK hook surface and what the app layer must own vs. delegate
- Auth architecture: how to prevent the biometric re-lock loop, AppState race condition fix
- Folder structure: iterated from flat → features-based → module-based with thin `app/` re-exports
- Security tradeoffs: mnemonic in navigation params, clipboard timeout, screenshot prevention
- Balance aggregation approach: why two independent sources, how to handle stale data after wallet switch
- APK size: diagnosed 460MB fat APK, fix via ABI splits and removing emulator architectures

---

## What AI Did Not Do

- Did not make architectural decisions unilaterally — each significant choice was discussed first
- Did not proceed when there was ambiguity — asked before implementing
- Did not skip security analysis to move faster

---

## Summary

The workflow was: **think together → agree → build**. AI accelerated the coding phase significantly, but the architecture, security posture, and product decisions were driven by the human throughout.
