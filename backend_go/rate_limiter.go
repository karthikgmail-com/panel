package main

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// IPRateLimiter stores rate limiters for IP addresses.
type IPRateLimiter struct {
	ips map[string]*rate.Limiter
	mu  *sync.RWMutex
	r   rate.Limit // Rate: requests per second
	b   int        // Burst size
}

// NewIPRateLimiter creates a new IPRateLimiter.
// r is the rate (e.g., 1 request per second means r=1).
// b is the burst size (how many requests can be made in a short burst).
func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	return &IPRateLimiter{
		ips: make(map[string]*rate.Limiter),
		mu:  &sync.RWMutex{},
		r:   r,
		b:   b,
	}
}

// AddIP creates a new rate limiter for the given IP address if one doesn't exist.
func (i *IPRateLimiter) AddIP(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	limiter, exists := i.ips[ip]
	if !exists {
		limiter = rate.NewLimiter(i.r, i.b)
		i.ips[ip] = limiter
	}
	return limiter
}

// GetLimiter returns the rate limiter for the given IP address.
func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.RLock()
	limiter, exists := i.ips[ip]
	i.mu.RUnlock()

	if !exists {
		return i.AddIP(ip) // Add IP if not found (lazy initialization)
	}
	return limiter
}

// Middleware function to apply rate limiting.
func (i *IPRateLimiter) Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			logger.Printf("RateLimiter: Error parsing RemoteAddr '%s': %v", r.RemoteAddr, err)
			// Fallback to using RemoteAddr directly if SplitHostPort fails (e.g., for non-standard formats or Unix sockets)
			ip = r.RemoteAddr
		}

		limiter := i.GetLimiter(ip)
		if !limiter.Allow() {
			logger.Printf("Rate limit exceeded for IP: %s on path: %s", ip, r.URL.Path)
			// Send a generic message to avoid revealing too much about the limiting mechanism
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	}
}

// Global rate limiters for different purposes
var (
	loginRateLimiter  *IPRateLimiter
	attackRateLimiter *IPRateLimiter
)

func initRateLimiters() {
	// Login limiter: e.g., 5 requests per minute, burst of 3
	loginRateLimiter = NewIPRateLimiter(rate.Every(12*time.Second), 3) // 5 req/min = 1 req / 12 sec

	// Attack start limiter: e.g., 1 request per 10 seconds, burst of 1
	// This is to prevent rapid start/stop or multiple start attempts.
	attackRateLimiter = NewIPRateLimiter(rate.Every(10*time.Second), 1)

	logger.Println("Rate limiters initialized.")

	// Optional: Goroutine to periodically clean up old IP entries from the limiters
	// This is important for long-running servers to prevent memory bloat if many unique IPs connect.
	// A more sophisticated approach might use a TTL cache for limiters.
	// For this example, we'll keep it simple. A production system would need this.
	go func() {
		for {
			time.Sleep(10 * time.Minute) // Clean up every 10 minutes

			loginRateLimiter.mu.Lock()
			for ip, limiter := range loginRateLimiter.ips {
				// A simple heuristic: if a limiter hasn't been used recently (Allow() would refresh it),
				// it could be removed. However, `rate.Limiter` doesn't expose last access time.
				// A more robust cleanup needs a TTL mechanism for map entries.
				// For now, this example doesn't implement active cleanup of the limiter map.
				// In a high-traffic scenario, this map could grow indefinitely.
				// Consider using a library that handles this or implement LRU cache.
				_ = limiter // Use limiter to avoid unused variable error if not doing complex cleanup
			}
			logger.Printf("Login rate limiter map size: %d", len(loginRateLimiter.ips))
			loginRateLimiter.mu.Unlock()

			attackRateLimiter.mu.Lock()
			logger.Printf("Attack rate limiter map size: %d", len(attackRateLimiter.ips))
			attackRateLimiter.mu.Unlock()
		}
	}()
}
```

Now, I'll integrate this into `main.go`:
1.  Call `initRateLimiters()` during startup.
2.  Wrap the `loginHandler` and `startAttackHandler` with their respective rate limiters.
