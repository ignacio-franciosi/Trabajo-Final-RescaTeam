package dto

// PushSubscription representa la suscripción Web Push
// que envía el navegador al backend.
type PushSubscription struct {
	Endpoint       string               `json:"endpoint"`
	ExpirationTime *int64               `json:"expirationTime,omitempty"`
	Keys           PushSubscriptionKeys `json:"keys"`
}

// PushSubscriptionKeys contiene las claves necesarias
// para el protocolo Web Push (Auth + P256dh).
type PushSubscriptionKeys struct {
	Auth   string `json:"auth"`
	P256dh string `json:"p256dh"`
}
