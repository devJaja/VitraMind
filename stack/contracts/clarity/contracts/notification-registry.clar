;; notification-registry.clar
;; Stores on-chain notification preferences and milestone acknowledgements.
;; Users opt in to specific notification types; oracle records milestone events.

(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-INVALID-TYPE (err u400))
(define-constant ORACLE 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; replace post-deploy

;; Notification types: u0=streak u1=milestone u2=insight u3=tip
(define-map preferences
  principal
  { streak: bool, milestone: bool, insight: bool, tip: bool }
)

(define-map milestone-events
  { user: principal, event-id: uint }
  { event-type: uint, block: uint, acknowledged: bool }
)

(define-map event-counts principal uint)

(define-read-only (get-preferences (user principal))
  (default-to { streak: true, milestone: true, insight: true, tip: true }
    (map-get? preferences user))
)

(define-read-only (get-event-count (user principal))
  (default-to u0 (map-get? event-counts user))
)

(define-read-only (get-event (user principal) (event-id uint))
  (map-get? milestone-events { user: user, event-id: event-id })
)

(define-public (set-preferences (streak bool) (milestone bool) (insight bool) (tip bool))
  (begin
    (map-set preferences tx-sender { streak: streak, milestone: milestone, insight: insight, tip: tip })
    (ok true)
  )
)

(define-public (record-milestone (user principal) (event-type uint))
  (let ((count (default-to u0 (map-get? event-counts user))))
    (asserts! (is-eq tx-sender ORACLE) ERR-UNAUTHORIZED)
    (asserts! (<= event-type u3) ERR-INVALID-TYPE)
    (map-set milestone-events { user: user, event-id: count }
      { event-type: event-type, block: block-height, acknowledged: false })
    (map-set event-counts user (+ count u1))
    (ok count)
  )
)

(define-public (acknowledge-event (event-id uint))
  (let ((ev (unwrap! (map-get? milestone-events { user: tx-sender, event-id: event-id }) (err u404))))
    (map-set milestone-events { user: tx-sender, event-id: event-id }
      (merge ev { acknowledged: true }))
    (ok true)
  )
)
