;; mood-oracle.clar
;; Stores aggregated (non-personal) mood signal digests anchored by the oracle.
;; Individual mood scores never appear on-chain — only weekly digest hashes.

(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ORACLE 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; replace post-deploy

(define-map mood-digests
  { user: principal, week: uint }
  { digest: (buff 32), sample-count: uint, anchored-at: uint }
)

(define-read-only (get-mood-digest (user principal) (week uint))
  (map-get? mood-digests { user: user, week: week })
)

(define-read-only (current-week)
  (/ block-height u1008) ;; ~1 week at 10-min blocks
)

(define-public (anchor-mood-digest (user principal) (digest (buff 32)) (sample-count uint))
  (begin
    (asserts! (is-eq tx-sender ORACLE) ERR-UNAUTHORIZED)
    (map-set mood-digests
      { user: user, week: (current-week) }
      { digest: digest, sample-count: sample-count, anchored-at: block-height }
    )
    (ok true)
  )
)
