;; streak-verifier
;; Anchors habit streak proofs with cooldown enforcement.
;; Oracle submits a streak proof once per day per user.
;; Cooldown: ~144 Bitcoin blocks ~= 24 hours (10 min/block)

(define-constant COOLDOWN u138) ;; ~23 hours in blocks
(define-constant ERR-NOT-ORACLE   (err u1))
(define-constant ERR-ZERO-ADDRESS (err u2))
(define-constant ERR-INVALID-HASH (err u3))
(define-constant ERR-ZERO-STREAK  (err u4))
(define-constant ERR-COOLDOWN     (err u5))
(define-constant ERR-NO-STREAKS   (err u6))
(define-constant ERR-OUT-OF-BOUNDS (err u7))

(define-constant ZERO-HASH 0x0000000000000000000000000000000000000000000000000000000000000000)

;; Oracle address (set at deploy time via a one-time init)
(define-data-var oracle principal tx-sender)

;; streak-count per user
(define-map streak-count principal uint)

;; user + index => streak entry
(define-map streaks
  { user: principal, index: uint }
  { proof-hash: (buff 32), current-streak: uint, submitted-at: uint }
)

;; last submission block per user
(define-map last-streak-at principal uint)

(define-read-only (get-oracle) (var-get oracle))

;; One-time oracle initialisation (only callable by current oracle / deployer)
(define-public (set-oracle (new-oracle principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle)) ERR-NOT-ORACLE)
    (print { event: "oracle-updated", old: (var-get oracle), new: new-oracle })
    (var-set oracle new-oracle)
    (ok true)
  )
)

;; Anchor a daily streak proof for a user (oracle only)
(define-public (anchor-streak (user principal) (proof-hash (buff 32)) (current-streak uint))
  (let ((count (default-to u0 (map-get? streak-count user)))
        (last  (default-to u0 (map-get? last-streak-at user))))
    (asserts! (is-eq tx-sender (var-get oracle)) ERR-NOT-ORACLE)
    (asserts! (not (is-eq proof-hash ZERO-HASH)) ERR-INVALID-HASH)
    (asserts! (> current-streak u0) ERR-ZERO-STREAK)
    (asserts! (>= stacks-block-height (+ last COOLDOWN)) ERR-COOLDOWN)
    (map-set last-streak-at user stacks-block-height)
    (map-set streaks { user: user, index: count }
      { proof-hash: proof-hash, current-streak: current-streak, submitted-at: stacks-block-height })
    (map-set streak-count user (+ count u1))
    (print { event: "streak-anchored", user: user, proof-hash: proof-hash,
             current-streak: current-streak, timestamp: stacks-block-height })
    (ok count)
  )
)

(define-read-only (get-streak-count (user principal))
  (default-to u0 (map-get? streak-count user))
)

(define-read-only (get-streak (user principal) (index uint))
  (map-get? streaks { user: user, index: index })
)

(define-read-only (latest-streak (user principal))
  (let ((count (default-to u0 (map-get? streak-count user))))
    (asserts! (> count u0) ERR-NO-STREAKS)
    (ok (map-get? streaks { user: user, index: (- count u1) }))
  )
)

(define-read-only (get-last-streak-at (user principal))
  (default-to u0 (map-get? last-streak-at user))
)
