;; growth-identity
;; Cross-app composable growth identity layer.
;; Users publish a signed identity commitment; third-party apps verify it.

(define-constant ERR-NOT-OWNER       (err u1))
(define-constant ERR-INVALID-COMMIT  (err u2))
(define-constant ERR-INVALID-LEVEL   (err u3))
(define-constant ERR-NO-IDENTITY     (err u4))
(define-constant ERR-ALREADY-INACTIVE (err u5))
(define-constant ERR-APP-NOT-ACTIVE  (err u6))
(define-constant ERR-UNAUTHORIZED    (err u7))
(define-constant ERR-NO-ACTIVE-ID    (err u8))
(define-constant ERR-EMPTY-NAME      (err u9))

(define-constant ZERO-HASH 0x0000000000000000000000000000000000000000000000000000000000000000)

(define-data-var contract-owner principal tx-sender)

;; user => identity
(define-map identities principal
  { commitment: (buff 32), growth-level: uint, published-at: uint, active: bool }
)

;; app-count
(define-data-var app-count uint u0)

;; app-id => registration
(define-map apps uint
  { name: (string-ascii 64), app-address: principal, active: bool }
)

;; app-id + user => verified
(define-map app-verifications { app-id: uint, user: principal } bool)

(define-read-only (get-owner) (var-get contract-owner))
(define-read-only (get-app-count) (var-get app-count))

;; Publish or update a growth identity commitment
(define-public (publish-identity (commitment (buff 32)) (growth-level uint))
  (begin
    (asserts! (not (is-eq commitment ZERO-HASH)) ERR-INVALID-COMMIT)
    (asserts! (and (>= growth-level u1) (<= growth-level u100)) ERR-INVALID-LEVEL)
    (map-set identities tx-sender
      { commitment: commitment, growth-level: growth-level,
        published-at: stacks-block-height, active: true })
    (print { event: "identity-published", user: tx-sender,
             commitment: commitment, growth-level: growth-level })
    (ok true)
  )
)

;; Deactivate the caller's identity
(define-public (deactivate-identity)
  (let ((id (unwrap! (map-get? identities tx-sender) ERR-NO-IDENTITY)))
    (asserts! (get active id) ERR-ALREADY-INACTIVE)
    (map-set identities tx-sender (merge id { active: false }))
    (print { event: "identity-deactivated", user: tx-sender })
    (ok true)
  )
)

(define-read-only (has-active-identity (user principal))
  (match (map-get? identities user)
    id (get active id)
    false
  )
)

(define-read-only (get-identity (user principal))
  (map-get? identities user)
)

;; Register a third-party app (owner only)
(define-public (register-app (name (string-ascii 64)) (app-address principal))
  (let ((app-id (var-get app-count)))
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (asserts! (> (len name) u0) ERR-EMPTY-NAME)
    (map-set apps app-id { name: name, app-address: app-address, active: true })
    (var-set app-count (+ app-id u1))
    (print { event: "app-registered", app-id: app-id, name: name, app-address: app-address })
    (ok app-id)
  )
)

;; Record that an app has verified a user's identity
(define-public (record-verification (app-id uint) (user principal))
  (let ((app (unwrap! (map-get? apps app-id) ERR-APP-NOT-ACTIVE)))
    (asserts! (get active app) ERR-APP-NOT-ACTIVE)
    (asserts! (or (is-eq tx-sender (get app-address app))
                  (is-eq tx-sender (var-get contract-owner))) ERR-UNAUTHORIZED)
    (asserts! (has-active-identity user) ERR-NO-ACTIVE-ID)
    (map-set app-verifications { app-id: app-id, user: user } true)
    (print { event: "app-verified", app-id: app-id, user: user })
    (ok true)
  )
)

(define-read-only (is-verified (app-id uint) (user principal))
  (default-to false (map-get? app-verifications { app-id: app-id, user: user }))
)
