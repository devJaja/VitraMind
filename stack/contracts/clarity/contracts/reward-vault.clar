;; reward-vault.clar
;; Non-custodial STX reward vault. Oracle triggers milestone payouts.
;; Users can claim accrued rewards; owner pre-funds the vault.

(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-INSUFFICIENT-FUNDS (err u402))
(define-constant ERR-NOTHING-TO-CLAIM (err u404))
(define-constant ORACLE 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; replace post-deploy
(define-constant OWNER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)   ;; replace post-deploy

;; Streak milestone rewards in micro-STX
(define-constant REWARD-7D  u500000)   ;; 0.5 STX
(define-constant REWARD-30D u2000000)  ;; 2 STX
(define-constant REWARD-100D u10000000) ;; 10 STX

(define-map pending-rewards principal uint)
(define-map claimed-rewards principal uint)
(define-map highest-streak-rewarded principal uint)

(define-read-only (get-pending (user principal))
  (default-to u0 (map-get? pending-rewards user))
)

(define-read-only (get-claimed (user principal))
  (default-to u0 (map-get? claimed-rewards user))
)

(define-read-only (vault-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-public (fund-vault (amount uint))
  (begin
    (asserts! (is-eq tx-sender OWNER) ERR-UNAUTHORIZED)
    (stx-transfer? amount tx-sender (as-contract tx-sender))
  )
)

(define-public (accrue-streak-reward (user principal) (streak-days uint))
  (let (
    (highest (default-to u0 (map-get? highest-streak-rewarded user)))
    (reward
      (if (and (>= streak-days u100) (< highest u100)) REWARD-100D
      (if (and (>= streak-days u30)  (< highest u30))  REWARD-30D
      (if (and (>= streak-days u7)   (< highest u7))   REWARD-7D
      u0)))
    )
  )
    (asserts! (is-eq tx-sender ORACLE) ERR-UNAUTHORIZED)
    (asserts! (> reward u0) (err u0))
    (map-set pending-rewards user (+ (get-pending user) reward))
    (map-set highest-streak-rewarded user streak-days)
    (ok reward)
  )
)

(define-public (claim-rewards)
  (let (
    (amount (get-pending tx-sender))
    (bal (vault-balance))
  )
    (asserts! (> amount u0) ERR-NOTHING-TO-CLAIM)
    (asserts! (>= bal amount) ERR-INSUFFICIENT-FUNDS)
    (map-set pending-rewards tx-sender u0)
    (map-set claimed-rewards tx-sender (+ (get-claimed tx-sender) amount))
    (as-contract (stx-transfer? amount tx-sender tx-sender))
  )
)
