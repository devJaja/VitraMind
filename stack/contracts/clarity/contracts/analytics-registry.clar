;; analytics-registry
;; Privacy-preserving on-chain analytics layer.
;; Oracle pushes weekly (period=u0) / monthly (period=u1) digest hashes.

(define-constant ERR-NOT-ORACLE    (err u1))
(define-constant ERR-INVALID-HASH  (err u2))
(define-constant ERR-INVALID-PERIOD (err u3))
(define-constant ERR-NO-SNAPSHOT   (err u4))
(define-constant ERR-OUT-OF-BOUNDS (err u5))

(define-constant ZERO-HASH 0x0000000000000000000000000000000000000000000000000000000000000000)

(define-data-var oracle principal tx-sender)

;; snapshot-count per user
(define-map snapshot-count principal uint)

;; user + index => snapshot
(define-map snapshots
  { user: principal, index: uint }
  { digest-hash: (buff 32), period: uint, timestamp: uint }
)

;; user + period => latest index + 1 (0 = none)
(define-map latest-index
  { user: principal, period: uint }
  uint
)

(define-read-only (get-oracle) (var-get oracle))

(define-public (set-oracle (new-oracle principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle)) ERR-NOT-ORACLE)
    (print { event: "oracle-updated", old: (var-get oracle), new: new-oracle })
    (var-set oracle new-oracle)
    (ok true)
  )
)

;; Anchor an analytics digest for a user (oracle only)
(define-public (anchor-snapshot (user principal) (digest-hash (buff 32)) (period uint))
  (let ((count (default-to u0 (map-get? snapshot-count user))))
    (asserts! (is-eq tx-sender (var-get oracle)) ERR-NOT-ORACLE)
    (asserts! (not (is-eq digest-hash ZERO-HASH)) ERR-INVALID-HASH)
    (asserts! (<= period u1) ERR-INVALID-PERIOD)
    (map-set snapshots { user: user, index: count }
      { digest-hash: digest-hash, period: period, timestamp: stacks-block-height })
    (map-set latest-index { user: user, period: period } (+ count u1))
    (map-set snapshot-count user (+ count u1))
    (print { event: "snapshot-anchored", user: user, digest-hash: digest-hash,
             period: period, timestamp: stacks-block-height })
    (ok count)
  )
)

(define-read-only (latest-snapshot (user principal) (period uint))
  (let ((idx (default-to u0 (map-get? latest-index { user: user, period: period }))))
    (asserts! (> idx u0) ERR-NO-SNAPSHOT)
    (ok (map-get? snapshots { user: user, index: (- idx u1) }))
  )
)

(define-read-only (get-snapshot-count (user principal))
  (default-to u0 (map-get? snapshot-count user))
)

(define-read-only (get-snapshot (user principal) (index uint))
  (map-get? snapshots { user: user, index: index })
)
