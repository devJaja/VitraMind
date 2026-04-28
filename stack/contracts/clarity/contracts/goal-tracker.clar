;; goal-tracker.clar
;; Privacy-first on-chain goal commitment registry.
;; Users commit a keccak256 hash of their goal — raw text never touches the chain.

(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-EXISTS (err u409))
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant MAX-GOALS u20)

(define-map goals
  { owner: principal, goal-id: uint }
  { commitment: (buff 32), status: uint, created-at: uint, updated-at: uint }
)

(define-map goal-counts principal uint)

(define-read-only (get-goal-count (user principal))
  (default-to u0 (map-get? goal-counts user))
)

(define-read-only (get-goal (user principal) (goal-id uint))
  (map-get? goals { owner: user, goal-id: goal-id })
)

(define-public (commit-goal (commitment (buff 32)))
  (let (
    (count (get-goal-count tx-sender))
    (new-id count)
  )
    (asserts! (< count MAX-GOALS) (err u429))
    (map-set goals
      { owner: tx-sender, goal-id: new-id }
      { commitment: commitment, status: u0, created-at: block-height, updated-at: block-height }
    )
    (map-set goal-counts tx-sender (+ count u1))
    (ok new-id)
  )
)

(define-public (update-goal-status (goal-id uint) (new-status uint))
  (let ((entry (unwrap! (get-goal tx-sender goal-id) ERR-NOT-FOUND)))
    (asserts! (<= new-status u2) (err u400)) ;; 0=active 1=completed 2=abandoned
    (map-set goals
      { owner: tx-sender, goal-id: goal-id }
      (merge entry { status: new-status, updated-at: block-height })
    )
    (ok true)
  )
)

(define-public (recommit-goal (goal-id uint) (new-commitment (buff 32)))
  (let ((entry (unwrap! (get-goal tx-sender goal-id) ERR-NOT-FOUND)))
    (map-set goals
      { owner: tx-sender, goal-id: goal-id }
      (merge entry { commitment: new-commitment, updated-at: block-height })
    )
    (ok true)
  )
)
