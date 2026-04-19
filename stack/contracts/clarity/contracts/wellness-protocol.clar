;; wellness-protocol
;; Registry for composable wellness protocols.
;; Third-party developers register protocols; users opt in and commit progress hashes.

(define-constant ERR-NOT-OWNER       (err u1))
(define-constant ERR-EMPTY-NAME      (err u2))
(define-constant ERR-EMPTY-CID       (err u3))
(define-constant ERR-UNKNOWN-PROTOCOL (err u4))
(define-constant ERR-ALREADY-INACTIVE (err u5))
(define-constant ERR-UNAUTHORIZED    (err u6))
(define-constant ERR-PROTOCOL-INACTIVE (err u7))
(define-constant ERR-ALREADY-OPTED-IN (err u8))
(define-constant ERR-NOT-OPTED-IN    (err u9))
(define-constant ERR-INVALID-HASH    (err u10))

(define-constant ZERO-HASH 0x0000000000000000000000000000000000000000000000000000000000000000)

(define-data-var contract-owner principal tx-sender)
(define-data-var protocol-count uint u0)

;; protocol-id => protocol
(define-map protocols uint
  { name: (string-ascii 64), schema-cid: (string-ascii 128),
    creator: principal, active: bool, created-at: uint }
)

;; protocol-id + user => opted-in
(define-map opted-in { protocol-id: uint, user: principal } bool)

;; protocol-id + user => latest progress commitment
(define-map progress { protocol-id: uint, user: principal }
  { commitment-hash: (buff 32), updated-at: uint }
)

(define-read-only (get-owner) (var-get contract-owner))
(define-read-only (get-protocol-count) (var-get protocol-count))

;; Register a new wellness protocol
(define-public (register-protocol (name (string-ascii 64)) (schema-cid (string-ascii 128)))
  (let ((protocol-id (var-get protocol-count)))
    (asserts! (> (len name) u0) ERR-EMPTY-NAME)
    (asserts! (> (len schema-cid) u0) ERR-EMPTY-CID)
    (map-set protocols protocol-id
      { name: name, schema-cid: schema-cid, creator: tx-sender,
        active: true, created-at: stacks-block-height })
    (var-set protocol-count (+ protocol-id u1))
    (print { event: "protocol-registered", protocol-id: protocol-id,
             name: name, creator: tx-sender })
    (ok protocol-id)
  )
)

;; Deactivate a protocol (creator or owner only)
(define-public (deactivate-protocol (protocol-id uint))
  (let ((p (unwrap! (map-get? protocols protocol-id) ERR-UNKNOWN-PROTOCOL)))
    (asserts! (get active p) ERR-ALREADY-INACTIVE)
    (asserts! (or (is-eq tx-sender (get creator p))
                  (is-eq tx-sender (var-get contract-owner))) ERR-UNAUTHORIZED)
    (map-set protocols protocol-id (merge p { active: false }))
    (print { event: "protocol-deactivated", protocol-id: protocol-id })
    (ok true)
  )
)

;; Opt into a wellness protocol
(define-public (opt-in (protocol-id uint))
  (let ((p (unwrap! (map-get? protocols protocol-id) ERR-UNKNOWN-PROTOCOL)))
    (asserts! (get active p) ERR-PROTOCOL-INACTIVE)
    (asserts! (not (default-to false (map-get? opted-in { protocol-id: protocol-id, user: tx-sender })))
              ERR-ALREADY-OPTED-IN)
    (map-set opted-in { protocol-id: protocol-id, user: tx-sender } true)
    (print { event: "user-opted-in", protocol-id: protocol-id, user: tx-sender })
    (ok true)
  )
)

;; Opt out of a wellness protocol
(define-public (opt-out (protocol-id uint))
  (begin
    (asserts! (default-to false (map-get? opted-in { protocol-id: protocol-id, user: tx-sender }))
              ERR-NOT-OPTED-IN)
    (map-set opted-in { protocol-id: protocol-id, user: tx-sender } false)
    (print { event: "user-opted-out", protocol-id: protocol-id, user: tx-sender })
    (ok true)
  )
)

;; Commit a progress hash for a protocol
(define-public (commit-progress (protocol-id uint) (commitment-hash (buff 32)))
  (let ((p (unwrap! (map-get? protocols protocol-id) ERR-UNKNOWN-PROTOCOL)))
    (asserts! (default-to false (map-get? opted-in { protocol-id: protocol-id, user: tx-sender }))
              ERR-NOT-OPTED-IN)
    (asserts! (get active p) ERR-PROTOCOL-INACTIVE)
    (asserts! (not (is-eq commitment-hash ZERO-HASH)) ERR-INVALID-HASH)
    (map-set progress { protocol-id: protocol-id, user: tx-sender }
      { commitment-hash: commitment-hash, updated-at: stacks-block-height })
    (print { event: "progress-committed", protocol-id: protocol-id,
             user: tx-sender, commitment-hash: commitment-hash })
    (ok true)
  )
)

(define-read-only (get-protocol (protocol-id uint))
  (map-get? protocols protocol-id)
)

(define-read-only (is-opted-in (protocol-id uint) (user principal))
  (default-to false (map-get? opted-in { protocol-id: protocol-id, user: user }))
)

(define-read-only (get-progress (protocol-id uint) (user principal))
  (map-get? progress { protocol-id: protocol-id, user: user })
)
