;; proof-registry
;; Immutable, append-only registry of hashed proofs.
;; Proof types: u0=LOG, u1=INSIGHT, u2=STREAK, u3=ACHIEVEMENT

;; proof-count per user
(define-map proof-count principal uint)

;; user + index => proof tuple
(define-map proofs
  { user: principal, index: uint }
  { hash: (buff 32), proof-type: uint, timestamp: uint }
)

;; duplicate detection: user + hash => exists
(define-map proof-exists
  { user: principal, hash: (buff 32) }
  bool
)

(define-constant ERR-INVALID-HASH (err u1))
(define-constant ERR-DUPLICATE    (err u2))
(define-constant ERR-OUT-OF-BOUNDS (err u3))
(define-constant ERR-INVALID-TYPE (err u4))

(define-constant ZERO-HASH 0x0000000000000000000000000000000000000000000000000000000000000000)

;; Submit a new proof commitment
(define-public (submit-proof (hash (buff 32)) (proof-type uint))
  (let ((count (default-to u0 (map-get? proof-count tx-sender))))
    (asserts! (not (is-eq hash ZERO-HASH)) ERR-INVALID-HASH)
    (asserts! (not (default-to false (map-get? proof-exists { user: tx-sender, hash: hash }))) ERR-DUPLICATE)
    (asserts! (<= proof-type u3) ERR-INVALID-TYPE)
    (map-set proof-exists { user: tx-sender, hash: hash } true)
    (map-set proofs { user: tx-sender, index: count }
      { hash: hash, proof-type: proof-type, timestamp: stacks-block-height })
    (map-set proof-count tx-sender (+ count u1))
    (print { event: "proof-submitted", user: tx-sender, hash: hash, proof-type: proof-type, timestamp: stacks-block-height })
    (ok count)
  )
)

;; Returns the total number of proofs submitted by a user
(define-read-only (get-proof-count (user principal))
  (default-to u0 (map-get? proof-count user))
)

;; Fetch a specific proof by index
(define-read-only (get-proof (user principal) (index uint))
  (map-get? proofs { user: user, index: index })
)

;; O(1) check whether a hash has been submitted by a user
(define-read-only (verify-proof (user principal) (hash (buff 32)))
  (default-to false (map-get? proof-exists { user: user, hash: hash }))
)
