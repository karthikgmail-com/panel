package main

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/sessions"
)

// Store for user sessions.
// The key must be a secret, preferrably from an environment variable.
// For AES-256, key must be 32 bytes. For AES-128, 16 bytes.
// Use `openssl rand -hex 32` to generate a key.
var store *sessions.CookieStore

// User struct for authentication (simplified)
type User struct {
	Username string
	// In a real app, store hashed passwords, not plain text.
	// PasswordHash string
}

// Credentials struct for login request
type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Hardcoded user for demonstration.
// In a real app, load from DB and use hashed passwords.
var panelUser = User{
	Username: "admin",
}
var panelPassword = "password" // Store this securely, e.g., env var for comparison

const (
	sessionName       = "gohulk-session"
	sessionUserKey    = "username"
	sessionAuthKey    = "authenticated"
	sessionMaxAge     = 3600 * 24 // 24 hours
	envSessionSecret  = "GOHULK_SESSION_SECRET"
	envPanelUsername  = "GOHULK_PANEL_USERNAME"
	envPanelPassword  = "GOHULK_PANEL_PASSWORD"
)

func initAuth() {
	sessionSecret := os.Getenv(envSessionSecret)
	if sessionSecret == "" {
		// Fallback to a default insecure key for development ONLY if no env var is set.
		// Log a prominent warning.
		logger.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		logger.Println("! WARNING: GOHULK_SESSION_SECRET environment variable not set. !")
		logger.Println("! Using a default, insecure session key.                       !")
		logger.Println("! THIS IS NOT SAFE FOR PRODUCTION.                             !")
		logger.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		sessionSecret = "default-insecure-secret-key-32-bytes" // Ensure it's 32 or 64 bytes for AES
		if len(sessionSecret) != 32 && len(sessionSecret) != 64 {
			// Adjust if necessary or panic
			sessionSecret = "default-insecure-secret-key-32-b" // needs to be 32 bytes
		}
	}
	store = sessions.NewCookieStore([]byte(sessionSecret))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   sessionMaxAge,
		HttpOnly: true,
		Secure:   false, // Set to true if using HTTPS in production
		SameSite: http.SameSiteLaxMode,
	}

	// Override default credentials if set in environment variables
	if envUser := os.Getenv(envPanelUsername); envUser != "" {
		panelUser.Username = envUser
	}
	if envPass := os.Getenv(envPanelPassword); envPass != "" {
		panelPassword = envPass
	}
	logger.Printf("Authentication initialized. Panel username: '%s'", panelUser.Username)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Replace with proper password hashing and comparison in a real app
	if creds.Username == panelUser.Username && creds.Password == panelPassword {
		session, err := store.Get(r, sessionName)
		if err != nil {
			// Best effort to create a new session if Get fails (e.g. cookie format error)
			// but log the error as it might indicate issues with the session key or store.
			logger.Printf("Error getting session (attempting to create new): %v", err)
			// No specific error handling for "value not found" as Get always returns a session.
			// Gorilla sessions handles creating a new session if one doesn't exist or is invalid.
		}

		session.Values[sessionUserKey] = panelUser.Username
		session.Values[sessionAuthKey] = true
		err = session.Save(r, w)
		if err != nil {
			logger.Printf("Error saving session: %v", err)
			http.Error(w, "Failed to save session", http.StatusInternalServerError)
			return
		}
		logger.Printf("User '%s' logged in successfully.", panelUser.Username)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Login successful", "username": panelUser.Username})
	} else {
		logger.Printf("Failed login attempt for username: '%s'", creds.Username)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
	}
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	session, _ := store.Get(r, sessionName)
	username, ok := session.Values[sessionUserKey].(string)
	if !ok {
		username = "unknown user"
	}

	session.Values[sessionAuthKey] = false
	session.Options.MaxAge = -1 // Delete cookie
	err := session.Save(r, w)
	if err != nil {
		logger.Printf("Error saving session on logout: %v", err)
		http.Error(w, "Failed to save session", http.StatusInternalServerError)
		return
	}
	logger.Printf("User '%s' logged out.", username)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Logged out successfully"})
}

func checkAuthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	session, _ := store.Get(r, sessionName)
	auth, okAuth := session.Values[sessionAuthKey].(bool)
	username, okUser := session.Values[sessionUserKey].(string)

	if okAuth && auth && okUser {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"isAuthenticated": true, "username": username})
	} else {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"isAuthenticated": false})
	}
}

// Middleware to protect handlers that require authentication
func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, sessionName)
		auth, ok := session.Values[sessionAuthKey].(bool)

		if !ok || !auth {
			logger.Printf("Unauthenticated access attempt to %s from %s", r.URL.Path, r.RemoteAddr)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		// If authenticated, call the next handler in the chain
		next.ServeHTTP(w, r)
	}
}

// You would also need a way to check auth for WebSocket upgrades.
// This usually involves checking the HTTP request that initiates the WebSocket connection.
func isWebSocketAuthenticated(r *http.Request) (bool, string) {
	session, err := store.Get(r, sessionName)
	if err != nil {
		// If there's an error getting the session (e.g. tampered cookie, bad key), treat as unauthenticated.
		logger.Printf("WebSocket auth check: error getting session: %v", err)
		return false, ""
	}

	auth, okAuth := session.Values[sessionAuthKey].(bool)
	username, okUser := session.Values[sessionUserKey].(string)

	if !okAuth || !auth || !okUser {
		return false, ""
	}
	return true, username
}
```

**Key elements in `auth.go`:**

*   **`gorilla/sessions`:** Imported for session management.
*   **`store`:** A global `CookieStore` for sessions.
*   **`initAuth()`:**
    *   Initializes the `CookieStore` with a secret key. **Crucially, this key should be loaded from an environment variable (`GOHULK_SESSION_SECRET`) for security.** A fallback and warning are included if the env var is not set (for development only).
    *   Configures session options (Path, MaxAge, HttpOnly, Secure, SameSite).
    *   Loads panel username/password from environment variables (`GOHULK_PANEL_USERNAME`, `GOHULK_PANEL_PASSWORD`) or uses defaults.
*   **`Credentials` and `User` structs:** For handling login data.
*   **`loginHandler`:**
    *   Decodes JSON username/password.
    *   Validates against the (currently hardcoded) `panelUser` and `panelPassword`.
    *   If valid, sets session values (`username`, `authenticated`).
*   **`logoutHandler`:** Clears authentication status in the session and sets `MaxAge = -1` to delete the cookie.
*   **`checkAuthHandler`:** Checks session status and returns JSON indicating if the user is authenticated and their username.
*   **`requireAuth` Middleware:** A simple middleware function that wraps an `http.HandlerFunc` to check for authentication. If not authenticated, it returns an HTTP 401 Unauthorized error.
*   **`isWebSocketAuthenticated`:** A helper function to check authentication status for WebSocket upgrade requests. This will be used by the WebSocket handler.

Now, I need to integrate this into `main.go`:
1.  Call `initAuth()` at the start.
2.  Register the new API routes (`/api/login`, `/api/logout`, `/api/check_auth`) in `mux`.
3.  Later, when adding more API endpoints that need protection (like starting/stopping attacks), they will be wrapped with `requireAuth`.
