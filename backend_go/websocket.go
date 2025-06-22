package main

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocketMessage struct for messages sent to clients
type WebSocketMessage struct {
	Type    string      `json:"type"` // e.g., "log", "status", "error", "attack_started", "attack_stopped"
	Payload interface{} `json:"payload"`
}

// Client represents a connected WebSocket client.
type Client struct {
	conn     *websocket.Conn
	send     chan []byte // Buffered channel of outbound messages.
	username string      // Username of the authenticated user for this client.
}

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	clients    map[*Client]bool // Registered clients.
	broadcast  chan []byte      // Inbound messages from the system to broadcast.
	register   chan *Client     // Register requests from clients.
	unregister chan *Client     // Unregister requests from clients.
	mu         sync.Mutex       // To protect clients map
}

var hub *Hub

// upgrader is used to upgrade HTTP connections to WebSocket connections.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for now. In production, you might want to restrict this.
		// Example: return r.Header.Get("Origin") == "http://localhost:8080"
		return true
	},
}

func initWebSocket() {
	hub = &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
	go hub.run()
	logger.Println("WebSocket Hub initialized and running.")
}

// run starts the Hub's event loop.
func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			logger.Printf("WebSocket client registered: %s (User: %s, Remote: %s)", client.conn.RemoteAddr(), client.username, client.conn.RemoteAddr())
			// Optionally send a welcome message or current status
			welcomeMsg := WebSocketMessage{Type: "status", Payload: "WebSocket connection established."}
			jsonMsg, _ := json.Marshal(welcomeMsg)
			client.send <- jsonMsg

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				logger.Printf("WebSocket client unregistered: %s (User: %s)", client.conn.RemoteAddr(), client.username)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default: // Don't block if a client's send channel is full
					close(client.send)
					delete(h.clients, client)
					logger.Printf("WebSocket client send buffer full or closed, removing: %s (User: %s)", client.conn.RemoteAddr(), client.username)
				}
			}
			h.mu.Unlock()
		}
	}
}

// BroadcastLog sends a log message to all connected WebSocket clients.
// This function will be called by the attack logic.
func BroadcastLog(logType string, message string) {
	if hub == nil {
		logger.Println("Error: Hub not initialized, cannot broadcast log.")
		return
	}
	logEntry := WebSocketMessage{
		Type:    logType, // e.g., "log_info", "log_error", "attack_update"
		Payload: message,
	}
	jsonMessage, err := json.Marshal(logEntry)
	if err != nil {
		logger.Printf("Error marshalling log message for WebSocket: %v", err)
		return
	}
	hub.broadcast <- jsonMessage
}

// BroadcastSystemStatus sends system status updates to all clients.
func BroadcastSystemStatus(statusPayload interface{}) {
	if hub == nil {
		logger.Println("Error: Hub not initialized, cannot broadcast system status.")
		return
	}
	msg := WebSocketMessage{Type: "system_status", Payload: statusPayload}
	jsonMessage, err := json.Marshal(msg)
	if err != nil {
		logger.Printf("Error marshalling system status for WebSocket: %v", err)
		return
	}
	hub.broadcast <- jsonMessage
}


// serveWs handles WebSocket requests from the peer.
func serveWs(w http.ResponseWriter, r *http.Request) {
	// Authenticate before upgrading to WebSocket
	authenticated, username := isWebSocketAuthenticated(r)
	if !authenticated {
		logger.Printf("WebSocket connection attempt rejected: Unauthenticated (Remote: %s)", r.RemoteAddr())
		http.Error(w, "Unauthorized: Authentication required for WebSocket", http.StatusUnauthorized)
		return
	}
	logger.Printf("WebSocket authentication successful for user: %s (Remote: %s)", username, r.RemoteAddr())


	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Printf("Error upgrading to WebSocket: %v (Remote: %s)", err, r.RemoteAddr())
		return
	}

	client := &Client{conn: conn, send: make(chan []byte, 256), username: username}
	hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in new goroutines.
	go client.writePump()
	go client.readPump()
}

// readPump pumps messages from the WebSocket connection to the hub.
// (Not strictly necessary if clients don't send messages, but good for detecting closure)
func (c *Client) readPump() {
	defer func() {
		hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(512) // Max message size
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second)) // Pong timeout
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(60 * time.Second)); return nil })

	for {
		// Clients are not expected to send messages in this application,
		// but we read to detect client closure or handle pings.
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Printf("WebSocket read error (client %s, user %s): %v", c.conn.RemoteAddr(), c.username, err)
			} else {
				// Normal closure or known error type, log less verbosely or not at all for CloseGoingAway
				logger.Printf("WebSocket connection closed by client %s (user %s): %v", c.conn.RemoteAddr(), c.username, err)

			}
			break
		}
		// If messages were expected from client, process them here.
	}
}

// writePump pumps messages from the hub to the WebSocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(45 * time.Second) // Ping period
	defer func() {
		ticker.Stop()
		c.conn.Close() // Ensure connection is closed on exit
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				logger.Printf("WebSocket client %s (user %s): hub closed send channel.", c.conn.RemoteAddr(), c.username)
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				logger.Printf("WebSocket write error (client %s, user %s): %v", c.conn.RemoteAddr(), c.username, err)
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			// n := len(c.send)
			// for i := 0; i < n; i++ {
			// 	w.Write(<-c.send) // Removed newline, assuming full JSON messages
			// }

			if err := w.Close(); err != nil {
				logger.Printf("WebSocket writer close error (client %s, user %s): %v", c.conn.RemoteAddr(), c.username, err)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				logger.Printf("WebSocket ping error (client %s, user %s): %v", c.conn.RemoteAddr(), c.username, err)
				return // Assume connection is dead
			}
		}
	}
}

```

**Key components in `websocket.go`:**

*   **`WebSocketMessage` struct:** Defines a standard structure for messages sent to clients (type and payload).
*   **`Client` struct:** Represents a connected client, holding its WebSocket connection, a send channel for outbound messages, and the authenticated username.
*   **`Hub` struct:**
    *   Manages all active clients.
    *   `clients`: A map of connected clients.
    *   `broadcast`: A channel to receive messages that need to be sent to all clients.
    *   `register` / `unregister`: Channels to handle client connections and disconnections safely.
    *   `run()`: The main event loop for the hub, processing registrations, unregistrations, and broadcasts. This runs in its own goroutine.
*   **`upgrader`:** An instance of `websocket.Upgrader` configured to handle the protocol switch. `CheckOrigin` is currently set to allow all origins for development.
*   **`initWebSocket()`:** Initializes the global `hub` and starts its `run()` loop.
*   **`BroadcastLog()` and `BroadcastSystemStatus()`:** Public functions that other parts of the application (like the attack logic or system status monitor) can call to send messages to all connected clients via the hub.
*   **`serveWs(w http.ResponseWriter, r *http.Request)`:**
    *   The HTTP handler for the `/ws` endpoint.
    *   **Authentication:** Crucially, it calls `isWebSocketAuthenticated(r)` (from `auth.go`) to verify the user's session cookie before upgrading the connection. Unauthorized attempts are rejected.
    *   Upgrades the HTTP connection to a WebSocket connection.
    *   Creates a `Client` object and registers it with the hub.
    *   Starts two goroutines for each client: `writePump` (sends messages from hub to client) and `readPump` (reads messages from client, primarily for detecting disconnections and handling pings/pongs).
*   **`readPump()` and `writePump()`:** Handle the specifics of reading from and writing to the WebSocket connection for each client, including timeouts and ping/pong messages to keep connections alive and detect closures.

**Integration into `main.go`:**

1.  Call `initWebSocket()` during server startup.
2.  Register `serveWs` as the handler for the `/ws` path.

Now, update `main.go`.
