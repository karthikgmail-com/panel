package main

import (
	"fmt"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
	// "github.com/shirou/gopsutil/v3/load" // For load average if needed
)

// SystemStats holds CPU and RAM usage information.
type SystemStats struct {
	CPUUsagePercent float64 `json:"cpu"` // CPU usage percentage
	RAMUsagePercent float64 `json:"ram"` // RAM usage percentage
	// Could add more: Load1, Load5, Load15 float64
}

// GetSystemStats retrieves current CPU and RAM usage.
func GetSystemStats() (*SystemStats, error) {
	// CPU Usage
	// cpu.Percent calculates the percentage of cpu used either per CPU or combined.
	// Passing 0 for interval means non-blocking (returns difference from last call).
	// Passing a duration for interval means blocking for that duration to get a reading.
	// For periodic checks, a small interval or relying on previous call is fine.
	// Let's use a short blocking call for a more immediate reading.
	cpuPercentages, err := cpu.Percent(time.Millisecond*200, false) // Get overall CPU percentage (false for per CPU=off)
	if err != nil {
		return nil, fmt.Errorf("error getting CPU usage: %w", err)
	}

	var overallCpuUsage float64
	if len(cpuPercentages) > 0 {
		overallCpuUsage = cpuPercentages[0] // cpu.Percent with false returns a slice with one value
	}

	// RAM Usage
	vmStats, err := mem.VirtualMemory()
	if err != nil {
		return nil, fmt.Errorf("error getting RAM usage: %w", err)
	}

	stats := &SystemStats{
		CPUUsagePercent: overallCpuUsage,
		RAMUsagePercent: vmStats.UsedPercent,
	}
	return stats, nil
}

// startSystemStatsEmitter periodically fetches system stats and broadcasts them via WebSocket.
// It should be run as a goroutine.
func startSystemStatsEmitter(interval time.Duration) {
	logger.Println("Starting system stats emitter...")
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			stats, err := GetSystemStats()
			if err != nil {
				logger.Printf("Error fetching system stats: %v", err)
				// Optionally send an error message over WebSocket, or just log and skip
				// BroadcastLog("system_error", fmt.Sprintf("Could not fetch system stats: %v", err))
				continue
			}
			// logger.Printf("Broadcasting system stats: CPU %.2f%%, RAM %.2f%%", stats.CPUUsagePercent, stats.RAMUsagePercent)

			// Need to get current active attacks count
			// This might require access to globalAttackState or a function to get this count
			// For now, let's assume a function getActiveAttackCount() exists or we add it to SystemStats struct later.
			// For simplicity, we'll omit active_attacks from here and let the frontend derive it or
			// have attack_status messages update it.
			// The frontend's app.js already has logic for active_attacks based on attack_status messages.
			// So we only need to send cpu and ram here.

			payload := map[string]interface{}{
				"cpu": fmt.Sprintf("%.1f%%", stats.CPUUsagePercent),
				"ram": fmt.Sprintf("%.1f%%", stats.RAMUsagePercent),
				// "active_attacks": getActiveAttackCount(), // This would be from attack_handler.go state
			}
			BroadcastSystemStatus(payload) // Uses the function from websocket.go
		}
	}
}

// Example of how to get active attack count if needed (this would typically be in attack_handler.go or similar)
/*
func getActiveAttackCount() int {
	globalAttackState.mu.Lock()
	defer globalAttackState.mu.Unlock()
	if globalAttackState.IsRunning {
		return 1
	}
	return 0
}
*/
```

**Explanation of `system_stats.go`:**

*   **Imports:** Includes `github.com/shirou/gopsutil/v3/cpu` and `github.com/shirou/gopsutil/v3/mem`.
*   **`SystemStats` struct:** To hold the CPU and RAM percentages.
*   **`GetSystemStats()` function:**
    *   Uses `cpu.Percent()` to get overall CPU usage. A small interval (200ms) is used for a fairly current reading.
    *   Uses `mem.VirtualMemory()` to get RAM statistics, specifically `UsedPercent`.
*   **`startSystemStatsEmitter(interval time.Duration)` function:**
    *   This function is designed to run as a goroutine.
    *   It uses a `time.Ticker` to periodically call `GetSystemStats()`.
    *   It then calls `BroadcastSystemStatus` (from `websocket.go`) to send these stats to all connected WebSocket clients. The payload is formatted as expected by the frontend.
    *   The `active_attacks` count part is commented out for now, as the frontend `app.js` already has logic to update this based on `attack_status` messages. Keeping this focused on CPU/RAM from `gopsutil`.

Next, I'll modify `main.go` to:
1.  Call `go startSystemStatsEmitter(5 * time.Second)` (e.g., emit stats every 5 seconds) during server startup.

And then run `go mod tidy`.
