## Agent Instructions for Go HULK Web Panel Project

**Project Goal:** Create a modern, high-performance web panel for launching HULK DoS lab tests. The entire backend will be in Go, and it will control a refactored version of the HULK Go script. The frontend (HTML/CSS/JS) will communicate with this Go backend.

**Key Technologies:**
- **Frontend:** HTML, Tailwind CSS, JavaScript. (Reusing existing frontend structure)
- **Backend:** Go (standard library, `gorilla/websocket`, `gorilla/sessions` or similar, `shirou/gopsutil` are likely).
- **DoS Tool:** Refactored HULK Go script (provided by user).

**Development Guidelines:**

1.  **Modularity:** Design Go packages and functions for clarity and testability.
2.  **Security:**
    *   Implement secure login and session management in Go.
    *   Validate and sanitize all user inputs on the backend.
    *   Use environment variables for sensitive configurations (secret keys, credentials).
    *   Be mindful of the ethical implications. This panel is for legitimate lab testing.
3.  **User Experience:**
    *   The web panel should be intuitive.
    *   Ensure mobile-friendliness (primarily a frontend concern).
    *   Provide real-time feedback (live logs via WebSockets from Go backend).
4.  **Go Code Quality:**
    *   Write clean, well-commented Go code. Follow standard Go idioms and formatting (`gofmt`).
    *   Handle errors gracefully.
    *   Manage goroutines effectively (e.g., using contexts for cancellation, waitgroups).
5.  **HULK Script Refactoring:**
    *   The provided HULK Go script (originally a standalone CLI tool) needs to be refactored into a library/package that the Go backend can call.
    *   This involves:
        *   Making its core logic callable as a function (e.g., `RunAttack(config AttackConfig)`).
        *   Parameterizing it (target, duration, concurrency, stop signals, logging mechanism).
        *   Replacing direct `fmt.Println` with a logging callback or channel.
        *   Enabling graceful stopping of the attack goroutines.
6.  **Logging:**
    *   The Go backend should have its own operational logs.
    *   The refactored HULK logic must provide its logs back to the backend, which then relays them to the frontend via WebSockets.
7.  **Dependencies (Go):**
    *   Use `go mod` for dependency management.
    *   Keep external dependencies minimal and well-justified.
8.  **Error Handling (Go):** Implement robust error handling throughout the Go backend. Return appropriate error messages/codes to the frontend.
9.  **Configuration (Go):** The Go backend should be configurable via environment variables (e.g., port, admin credentials, session secret key).
10. **Proxy Support (Stretch Goal for HULK):** If implementing proxy support for HULK, ensure it's an optional feature and configurable. This will involve modifying HULK's HTTP client.

**Workflow:**

*   Follow the established plan for developing the Go application.
*   Communicate progress and any issues clearly.
*   The Python backend (`zxd_panel/backend`) is now DEPRECATED for this project.
*   The frontend (`zxd_panel/frontend`) will be copied to `gohulk_panel/frontend` and its JavaScript (`app.js`) will be updated to work with the new Go backend.

**Environment Specifics (User Provided):**
*   Target deployment: VPS Ubuntu. Go's single binary output will be beneficial here.

**Disclaimer for the User (to be included in the README):**
"This tool is intended for educational purposes and for testing your own infrastructure or infrastructure you have explicit permission to test. Unauthorized attacks on any system are illegal. The developers assume no liability and are not responsible for any misuse or damage caused by this tool."
