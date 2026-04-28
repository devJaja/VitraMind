;; leaderboard.clar
;; Privacy-preserving opt-in leaderboard.
;; Users publish only their streak count and a display alias — no personal data.

(define-constant ERR-ALIAS-TOO-LONG (err u400))
(define-constant MAX-ALIAS-LEN u24)

(define-map entries
  principal
  { alias: (string-ascii 24), streak: uint, points: uint, updated-at: uint }
)

(define-read-only (get-entry (user principal))
  (map-get? entries user)
)

(define-public (publish-score (alias (string-ascii 24)) (streak uint) (points uint))
  (begin
    (asserts! (<= (len alias) MAX-ALIAS-LEN) ERR-ALIAS-TOO-LONG)
    (map-set entries tx-sender
      { alias: alias, streak: streak, points: points, updated-at: block-height }
    )
    (ok true)
  )
)

(define-public (remove-entry)
  (begin
    (map-delete entries tx-sender)
    (ok true)
  )
)
