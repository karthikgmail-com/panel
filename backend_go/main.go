package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var logger *log.Logger

func main() {
	listenAddr := flag.String("addr", ":8080", "HTTP network address")
	frontendDir := flag.String("frontend", "../frontend", "Path to frontend static files")
	flag.Parse()

	logger = log.New(os.Stdout, "[GoHulkPanel] ", log.LstdFlags|log.Lmicroseconds|log.Lshortfile)
	logger.Println("Starting Go HULK Web Panel Backend...")

	initAuth()          // Initialize authentication (from auth.go)
	initWebSocket()     // Initialize WebSocket Hub (from websocket.go)
	// initHistory()    // Skipped due to file issues with hulk.go stats
	initRateLimiters()  // Initialize rate limiters (from rate_limiter.go)


	logger.Printf("Listening on: %s", *listenAddr)
	absFrontendDir, err := filepath.Abs(*frontendDir)
	if err != nil {
		logger.Fatalf("Error resolving frontend directory path: %v", err)
	}
	logger.Printf("Serving frontend files from: %s", absFrontendDir)

	mux := http.NewServeMux()

	// Authentication routes
	// Apply rate limiter to login handler
	mux.HandleFunc("/api/login", loginRateLimiter.Middleware(loginHandler))
	mux.HandleFunc("/api/logout", logoutHandler) // No rate limit on logout usually needed
	mux.HandleFunc("/api/check_auth", checkAuthHandler)

	// Attack management routes (protected by authentication)
	// Apply rate limiter to start attack handler
	mux.HandleFunc("/api/attack/start", requireAuth(attackRateLimiter.Middleware(startAttackHandler)))
	mux.HandleFunc("/api/attack/stop", requireAuth(stopAttackHandler)) // Rate limiting stop might be less critical
	mux.HandleFunc("/api/attack/status", requireAuth(attackStatusHandler))
	// mux.HandleFunc("/api/attack/history", requireAuth(getAttackHistoryHandler)) // Skipped

	// WebSocket handler (authentication is checked within serveWs)
	mux.HandleFunc("/ws", serveWs)

	// Static file serving for the frontend
	fs := http.FileServer(http.Dir(absFrontendDir))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/ws") {
			// This ensures that requests to /api/ or /ws not matching specific handlers above get a 404
			http.NotFound(w, r)
			return
		}

		staticFilePath := filepath.Join(absFrontendDir, r.URL.Path)
		fInfo, statErr := os.Stat(staticFilePath)

		if os.IsNotExist(statErr) || (statErr == nil && fInfo.IsDir()) {
			http.ServeFile(w, r, filepath.Join(absFrontendDir, "index.html"))
			return
		} else if statErr != nil {
			logger.Printf("Error checking for static file %s: %v", r.URL.Path, statErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		fs.ServeHTTP(w, r)
	})

	server := &http.Server{
		Addr:         *listenAddr,
		Handler:      mux,
		ErrorLog:     logger,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	logger.Printf("Server is ready to handle requests at %s", *listenAddr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatalf("Could not listen on %s: %v\n", *listenAddr, err)
	}

	logger.Println("Server stopped.")
}
```

**Changes in `main.go`:**

1.  **`initRateLimiters()` call:** Added this call during server startup.
2.  **Middleware Application:**
    *   The `/api/login` handler is now wrapped with `loginRateLimiter.Middleware(...)`.
    *   The `/api/attack/start` handler is now wrapped with `requireAuth(attackRateLimiter.Middleware(startAttackHandler))`. Note that `requireAuth` is still the outer middleware.

Now, run `go mod tidy` to include `golang.org/x/time/rate`.
