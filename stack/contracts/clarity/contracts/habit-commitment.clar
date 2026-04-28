;; habit-commitment.clar
;; Users commit to specific habits with a target frequency and deadline.
;; Progress is tracked via commitment hashes — raw habit data stays off-chain.

(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-INVALID-FREQ (err u400))
(define-constant ERR-EXPIRED (err u410))
(define-constant MAX-HABITS u10)

(define-map habits
  { owner: principal, habit-id: uint }
  { commitment: (buff 32), frequency: uint, deadline-block: uint,
    check-ins: uint, created-at: uint }
)

(define-map habit-counts principal uint)

(define-read-only (get-habit-count (user principal))
  (default-to u0 (map-get? habit-counts user))
)

(define-read-only (get-habit (user principal) (habit-id uint))
  (map-get? habits { owner: user, habit-id: habit-id })
)

;; frequency: times per week (1-7)
;; deadline-blocks: number of blocks until deadline (~10 min each)
(define-public (commit-habit (commitment (buff 32)) (frequency uint) (deadline-blocks uint))
  (let ((count (default-to u0 (map-get? habit-counts tx-sender))))
    (asserts! (< count MAX-HABITS) (err u429))
    (asserts! (and (>= frequency u1) (<= frequency u7)) ERR-INVALID-FREQ)
    (map-set habits { owner: tx-sender, habit-id: count }
      { commitment: commitment, frequency: frequency,
        deadline-block: (+ block-height deadline-blocks),
        check-ins: u0, created-at: block-height })
    (map-set habit-counts tx-sender (+ count u1))
    (ok count)
  )
)

(define-public (check-in (habit-id uint))
  (let ((h (unwrap! (get-habit tx-sender habit-id) ERR-NOT-FOUND)))
    (asserts! (<= block-height (get deadline-block h)) ERR-EXPIRED)
    (map-set habits { owner: tx-sender, habit-id: habit-id }
      (merge h { check-ins: (+ (get check-ins h) u1) }))
    (ok (+ (get check-ins h) u1))
  )
)

(define-read-only (completion-rate (user principal) (habit-id uint))
  (match (get-habit user habit-id)
    h (let ((target (* (get frequency h) (/ (- (get deadline-block h) (get created-at h)) u1008))))
        (if (> target u0)
          (ok (/ (* (get check-ins h) u100) target))
          (ok u0)))
    ERR-NOT-FOUND
  )
)
