# Performance Baseline

## Measurement environment

Measured 2026-08-07 with `npm run benchmark` on Node v24.15.0, Linux 6.18.35 x64, 3 reported Intel Xeon Platinum 8370C CPUs, and 18,361.77 MiB reported memory. The repository requires Node 22; therefore these numbers are development evidence, not release qualification. The repeatable harness is `scripts/benchmark.mjs`; raw runs are intentionally ignored because results are machine-specific.

| Workload | Create | Normalize | Validate | Search index | Serialize | Deserialize | JSON size | Heap after scenario |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 elements, 100 presentations, 1,000 relationships | 18.76 ms | 173.12 ms | 89.06 ms | 0.79 ms | 13.42 ms | 4.40 ms | 778,785 B | 9.54 MiB |
| 10,000 elements, 1,000 presentations, 5,000 relationships | 48.98 ms | 6,142.30 ms | 2,906.92 ms | 8.93 ms | 89.56 ms | 30.33 ms | 6,036,923 B | 45.96 MiB |

Additional isolated workloads: transforming 10,000 workbook-like rows took **5.27 ms**; replaying 10,000 real `set-property` operations took **652.29 ms**; constructing 5,000 queued collaboration-operation envelopes took **1.03 ms**; final process heap was **73.17 MiB**. Both synthetic projects have complete package ownership/context and validation reported zero issues.

## Method and limits

The harness creates plain synthetic model records, calls the production normalization, validation, and operation replay code, constructs a simple search index, and times JSON serialization. Workbook-like processing measures normalized row transformation, **not XLSX parsing or transactional importer reconciliation**. Queue construction is not network synchronization. Heap snapshots are point-in-time Node readings, not retained-memory analysis.

No browser frame rate, SVG interaction latency, import-file throughput, Durable Object capacity, WebSocket latency, simultaneous-user capacity, cold-start behavior, or production percentile has been measured. There are no performance pass/fail targets yet. The 10,000-element normalization and validation values indicate a scaling investigation should precede any high-performance claim.

Run `npm run benchmark`; use `npm run benchmark -- --quick` for the smaller smoke workload. Compare results only on controlled hardware and the supported Node 22 runtime.
