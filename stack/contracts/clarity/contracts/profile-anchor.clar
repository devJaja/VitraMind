;; profile-anchor
;; Stores a cryptographic identity anchor per user.
;; Raw data never touches chain - only keccak256 commitments.

(define-map profile-hash principal (buff 32))
(define-map updated-at principal uint)


;; Anchor or update the caller's profile commitment
(define-public (anchor-profile (hash (buff 32)))
  (begin
    (asserts! (not (is-eq hash 0x0000000000000000000000000000000000000000000000000000000000000000)) (err u1))
    (map-set profile-hash tx-sender hash)
    (map-set updated-at tx-sender stacks-block-height)
    (print { event: "profile-anchored", user: tx-sender, hash: hash, timestamp: stacks-block-height })
    (ok true)
  )
)

;; Returns the profile hash for a user (none if not set)
(define-read-only (get-profile-hash (user principal))
  (map-get? profile-hash user)
)

;; Returns true if the user has ever anchored a profile
(define-read-only (has-profile (user principal))
  (is-some (map-get? profile-hash user))
)

;; Returns the block height of the last profile update
(define-read-only (get-updated-at (user principal))
  (default-to u0 (map-get? updated-at user))
)
