use std::path::PathBuf;

pub use leansig::signature::generalized_xmss::instantiations_aborting::lifetime_2_to_the_32::{
    PubKeyAbortingTargetSumLifetime32Dim46Base8 as XmssPublicKey,
    SchemeAbortingTargetSumLifetime32Dim46Base8 as XmssScheme,
    SecretKeyAbortingTargetSumLifetime32Dim46Base8 as XmssSecretKey,
    SigAbortingTargetSumLifetime32Dim46Base8 as XmssSignature,
};
use leansig::{serialization::Serializable, signature::SignatureScheme, MESSAGE_LENGTH};
use rec_aggregation::AggregatedXMSS;

const MESSAGE: [u8; MESSAGE_LENGTH] = [0u8; MESSAGE_LENGTH];
const EPOCH: u32 = 0;
const LOG_INV_RATE: usize = 2;

fn time_of<T>(f: impl FnOnce() -> T) -> (T, usize) {
    let start_time = std::time::Instant::now();
    let result = f();
    let time_ms = start_time.elapsed().as_millis() as usize;
    (result, time_ms)
}

pub struct Key {
    pub secret_key: XmssSecretKey,
    pub public_key: XmssPublicKey,
    pub signature: XmssSignature,
    pub size: usize,
    pub sign_ms: usize,
    pub verify_ms: usize,
}
impl Key {
    fn load(i: usize) -> Self {
        let cache_dir = PathBuf::from(format!("cache/{i}"));
        let secret_key_name = "sk";
        let public_key_name = "pk";
        let (secret_key, public_key) = if !std::fs::exists(&cache_dir).unwrap() {
            let cache_dir_tmp = cache_dir.with_added_extension("tmp");
            let epochs = 1;
            std::fs::create_dir_all(&cache_dir_tmp).unwrap();
            let (public_key, secret_key) = XmssScheme::key_gen(&mut rand::rng(), 0, epochs);
            std::fs::write(cache_dir_tmp.join(secret_key_name), secret_key.to_bytes()).unwrap();
            std::fs::write(cache_dir_tmp.join(public_key_name), public_key.to_bytes()).unwrap();
            std::fs::rename(&cache_dir_tmp, &cache_dir).unwrap();
            (secret_key, public_key)
        } else {
            let secret_key =
                XmssSecretKey::from_bytes(&std::fs::read(cache_dir.join(secret_key_name)).unwrap())
                    .unwrap();
            let public_key =
                XmssPublicKey::from_bytes(&std::fs::read(cache_dir.join(public_key_name)).unwrap())
                    .unwrap();
            (secret_key, public_key)
        };
        let (signature, sign_ms) =
            time_of(|| XmssScheme::sign(&secret_key, EPOCH, &MESSAGE).unwrap());
        let size = signature.to_bytes().len();
        let (_, verify_ms) =
            time_of(|| assert!(XmssScheme::verify(&public_key, EPOCH, &MESSAGE, &signature)));
        Self {
            secret_key,
            public_key,
            signature,
            size,
            sign_ms,
            verify_ms,
        }
    }
}

struct Proof {
    keys: Vec<XmssPublicKey>,
    proof: AggregatedXMSS,
    size: usize,
    aggregate_ms: usize,
    verify_ms: usize,
}
fn aggregate(proofs: &[&Proof], signatures: &[&Key]) -> Proof {
    let ((keys, proof), aggregate_ms) = time_of(|| {
        rec_aggregation::xmss_aggregate(
            &proofs
                .iter()
                .map(|proof| (&proof.keys[..], proof.proof.clone()))
                .collect::<Vec<_>>(),
            signatures
                .iter()
                .map(|key| (key.public_key.clone(), key.signature.clone()))
                .collect(),
            &MESSAGE,
            EPOCH,
            LOG_INV_RATE,
        )
    });
    let size = proof.serialize().len();
    let (_, verify_ms) =
        time_of(|| rec_aggregation::xmss_verify_aggregation(keys.clone(), &proof, &MESSAGE, EPOCH));
    Proof {
        keys,
        proof,
        size,
        aggregate_ms,
        verify_ms,
    }
}

fn main() {
    rec_aggregation::init_aggregation_bytecode();
    backend::precompute_dft_twiddles::<backend::KoalaBear>(1 << 24);

    let keys: Vec<_> = (0..4).map(Key::load).collect();
    println!(
        "signature {}, sign {}ms, verify {}ms",
        keys[0].size, keys[0].sign_ms, keys[0].verify_ms,
    );
    let proof0 = aggregate(&[], &[&keys[0]]);
    let proof1 = aggregate(&[], &[&keys[1]]);
    let proof01 = aggregate(&[], &[&keys[0], &keys[1]]);
    let proof012 = aggregate(&[], &[&keys[0], &keys[1], &keys[2], &keys[3]]);
    let proof0123 = aggregate(&[], &[&keys[0], &keys[1], &keys[2]]);
    let proof23 = aggregate(&[], &[&keys[2], &keys[3]]);
    let print_aggregated = |label: &str, proof: &Proof| {
        println!(
            "aggregated {} {}, aggregate {:4}ms, verify {}ms",
            label, proof.size, proof.aggregate_ms, proof.verify_ms,
        );
    };
    print_aggregated("0          ", &proof0);
    print_aggregated("0 1        ", &proof01);
    print_aggregated("0 1 2      ", &proof012);
    print_aggregated("0 1 2 3    ", &proof0123);
    print_aggregated("[0] 1      ", &aggregate(&[&proof0], &[&keys[1]]));
    print_aggregated("[0] [1]    ", &aggregate(&[&proof0, &proof1], &[]));
    print_aggregated("[0 1] [2 3]", &aggregate(&[&proof01, &proof23], &[]));
}
