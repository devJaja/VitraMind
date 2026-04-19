;; ipfs-export-registry
;; Anchors encrypted IPFS export CIDs on-chain.
;; Export types: u0=FULL, u1=LOGS, u2=INSIGHTS, u3=ANALYTICS

(define-constant ERR-EMPTY-CID     (err u1))
(define-constant ERR-INVALID-HASH  (err u2))
(define-constant ERR-INVALID-TYPE  (err u3))
(define-constant ERR-NO-EXPORTS    (err u4))
(define-constant ERR-OUT-OF-BOUNDS (err u5))

(define-constant ZERO-HASH 0x0000000000000000000000000000000000000000000000000000000000000000)

;; export-count per user
(define-map export-count principal uint)

;; user + index => export record
(define-map exports
  { user: principal, index: uint }
  { cid: (string-ascii 128), content-hash: (buff 32), export-type: uint, timestamp: uint }
)

;; duplicate detection: user + content-hash => exists
(define-map hash-exists
  { user: principal, content-hash: (buff 32) }
  bool
)

;; Anchor an encrypted IPFS export record
(define-public (anchor-export (cid (string-ascii 128)) (content-hash (buff 32)) (export-type uint))
  (let ((count (default-to u0 (map-get? export-count tx-sender))))
    (asserts! (> (len cid) u0) ERR-EMPTY-CID)
    (asserts! (not (is-eq content-hash ZERO-HASH)) ERR-INVALID-HASH)
    (asserts! (<= export-type u3) ERR-INVALID-TYPE)
    (map-set exports { user: tx-sender, index: count }
      { cid: cid, content-hash: content-hash, export-type: export-type, timestamp: stacks-block-height })
    (map-set hash-exists { user: tx-sender, content-hash: content-hash } true)
    (map-set export-count tx-sender (+ count u1))
    (print { event: "export-anchored", user: tx-sender, cid: cid,
             content-hash: content-hash, export-type: export-type, timestamp: stacks-block-height })
    (ok count)
  )
)

(define-read-only (get-export-count (user principal))
  (default-to u0 (map-get? export-count user))
)

(define-read-only (get-export (user principal) (index uint))
  (map-get? exports { user: user, index: index })
)

(define-read-only (latest-export (user principal))
  (let ((count (default-to u0 (map-get? export-count user))))
    (asserts! (> count u0) ERR-NO-EXPORTS)
    (ok (map-get? exports { user: user, index: (- count u1) }))
  )
)

(define-read-only (verify-export (user principal) (content-hash (buff 32)))
  (default-to false (map-get? hash-exists { user: user, content-hash: content-hash }))
)
