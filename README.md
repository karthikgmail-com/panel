# Go HULK Web Panel

This project provides a web-based dashboard to launch, monitor, and manage HULK DoS lab tests. The backend is written in Go, and it uses a modified version of the HULK Go DoS script.

## Features (Planned)

- Secure login and session control (Go backend).
- Mobile-friendly user interface (HTML, Tailwind CSS, JS).
- Launch HULK DoS tests with custom options (target, concurrency, headers).
- Real-time logging of attack status and output via WebSockets.
- Attack history.
- (Bonus) CPU/RAM usage display.
- (Stretch Goal) Proxy support for HULK attacks.

## Project Structure

- `backend_go/`: Contains the Go backend application source code.
  - `go.mod`, `go.sum`: Go module files.
  - `main.go`: Main application entry point.
  - Other `.go` files for handlers, logic, etc.
- `frontend/`: Contains HTML, CSS, and JavaScript for the web panel.
  - `index.html`: Main page.
  - `css/`: Stylesheets.
  - `js/`: JavaScript logic.
- `AGENTS.md`: Instructions for AI agent development.

## Setup and Installation (To be detailed later)

1.  **Prerequisites:**
    *   Go (version 1.18+ recommended).
2.  **Backend:**
    *   Navigate to `backend_go`.
    *   Build the backend: `go build -o gohulk_backend`
    *   Run the backend: `./gohulk_backend` (Configuration via environment variables).
3.  **Frontend:**
    *   Served directly by the Go backend.

## Usage (To be detailed later)

- Access the web panel through your browser (default: `http://localhost:PORT_NUMBER`).
- Log in with credentials.
- Configure and launch HULK attacks.

## Disclaimer

This tool is intended for educational purposes and for testing your own infrastructure or infrastructure you have explicit permission to test. Unauthorized attacks on any system are illegal. The developers assume no liability and are not responsible for any misuse or damage caused by this tool.
