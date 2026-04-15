
```sh
cargo run --release
```

leanMultisig 2eb4b9d, arm64 (Apple M1)
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
