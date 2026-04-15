
```sh
cargo run --release
```

leanMultisig 2eb4b9d, arm64 (Apple M1, 8 cores)
```log
signature 2536, sign 13ms, verify 0ms
aggregated 0           168479, aggregate  306ms, verify 30ms
aggregated 0 1         174888, aggregate  333ms, verify 30ms
aggregated 0 1 2       185321, aggregate  308ms, verify 30ms
aggregated 0 1 2 3     174160, aggregate  271ms, verify 30ms
aggregated [0] 1       230306, aggregate 1384ms, verify 38ms
aggregated [0] [1]     239575, aggregate 2495ms, verify 39ms
aggregated [0 1] [2 3] 238745, aggregate 2483ms, verify 40ms
```

leanMultisig 2eb4b9d, amd64 (AMD EPYC-Rome, 16 cores, kvm?)
```log
signature 2536, sign 25ms, verify 1ms
aggregated 0           169864, aggregate 1290ms, verify 59ms
aggregated 0 1         175711, aggregate 1120ms, verify 60ms
aggregated 0 1 2       185708, aggregate 1338ms, verify 62ms
aggregated 0 1 2 3     175914, aggregate 1520ms, verify 59ms
aggregated [0] 1       230910, aggregate 6071ms, verify 75ms
aggregated [0] [1]     240248, aggregate 12206ms, verify 85ms
aggregated [0 1] [2 3] 240382, aggregate 11683ms, verify 82ms
```
