# Folder layout

`_dev_guide/` holds development instructions, `_docs/` retained explanations and
`_tools/` maintained helper scripts. `.artifacts/` and `.builds/` are ignored and
fully disposable. Create artifact categories `tests/`, `benchmarks/`, `captures/`,
`tools/` and `scratch/` only when needed; keep required originals and evidence elsewhere.

Native framework paths, authored assets/content, existing build/dist/target/cache
folders, installed data and external checkouts are retained exceptions. Being
ignored does not make them disposable. This migration does not move or purge them.

Cleanup scripts under `_tools/cleanup/` target only `.artifacts/` or `.builds/`.
Default behavior invokes declared children; `--current-only` stays local and
`--dry-run` lists targets. They were added, not executed. Child roots are explicit
in `_tools/workspace.json`; undeclared dependencies and services are excluded.
