// Python Quest launcher.
//
// One self-contained executable: the built web app (including Python/Pyodide,
// voice-overs and fonts) is embedded inside it. Double-click it and it serves
// the app on this computer only (127.0.0.1) and opens the default browser.
// Nothing to install, no internet needed.
package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path"
	"strconv"
	"strings"
	"syscall"
	"time"
)

//go:embed all:web
var embedded embed.FS

// Set at build time: -ldflags "-X main.version=0.1.0"
var version = "dev"

const (
	// A fixed port keeps the same web address on every launch, so the browser
	// remembers progress and the accepted responsibility notice.
	firstPort  = 51730
	portTries  = 10
	healthPath = "/__python-quest"
	healthBody = "python-quest"
)

// Explicit types: on Windows the registry can map .js to text/plain, which breaks the app.
var contentTypes = map[string]string{
	".html":        "text/html; charset=utf-8",
	".js":          "text/javascript; charset=utf-8",
	".mjs":         "text/javascript; charset=utf-8",
	".css":         "text/css; charset=utf-8",
	".json":        "application/json",
	".webmanifest": "application/manifest+json",
	".map":         "application/json",
	".wasm":        "application/wasm",
	".zip":         "application/zip",
	".svg":         "image/svg+xml",
	".png":         "image/png",
	".ico":         "image/x-icon",
	".mp3":         "audio/mpeg",
	".woff2":       "font/woff2",
	".txt":         "text/plain; charset=utf-8",
}

func main() {
	setupConsole()

	site, err := fs.Sub(embedded, "web")
	if err != nil || !exists(site, "index.html") {
		fail("This build doesn't contain the app. Build it with: npm run package")
	}

	ln, url, alreadyRunning := listen()
	if alreadyRunning {
		fmt.Printf("\n  Python Quest is already running: %s\n  Python Quest ya se está ejecutando: %s\n\n", url, url)
		_ = openBrowser(url)
		time.Sleep(3 * time.Second)
		return
	}

	srv := &http.Server{Handler: handler(site), ReadHeaderTimeout: 10 * time.Second}
	go func() {
		if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
			fail("Server error: " + err.Error())
		}
	}()

	printBanner(url)
	if os.Getenv("PYTHON_QUEST_NO_BROWSER") == "" {
		if err := openBrowser(url); err != nil {
			fmt.Printf("  Open this address in your browser / Abre esta dirección en tu navegador: %s\n\n", url)
		}
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	fmt.Println("\n  Bye! / ¡Hasta luego!")
}

// listen finds the first free port in our range, or detects a copy that is already running.
func listen() (net.Listener, string, bool) {
	start := firstPort
	if p, err := strconv.Atoi(os.Getenv("PYTHON_QUEST_PORT")); err == nil && p > 0 {
		start = p
	}
	for port := start; port < start+portTries; port++ {
		url := fmt.Sprintf("http://127.0.0.1:%d/", port)
		ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", port))
		if err == nil {
			return ln, url, false
		}
		if isPythonQuest(url) {
			return nil, url, true
		}
	}
	fail(fmt.Sprintf("No free port between %d and %d.", start, start+portTries-1))
	return nil, "", false
}

func isPythonQuest(url string) bool {
	client := http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(strings.TrimSuffix(url, "/") + healthPath)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 64))
	return string(body) == healthBody
}

// handler serves the embedded files. Text files are stored gzip-compressed
// (name.gz) and sent as-is to browsers that accept gzip (all modern ones).
func handler(site fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if r.URL.Path == healthPath {
			_, _ = io.WriteString(w, healthBody)
			return
		}

		name := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
		if name == "" || name == "." {
			name = "index.html"
		}
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "no-referrer")
		if ct, ok := contentTypes[path.Ext(name)]; ok {
			h.Set("Content-Type", ct)
		}
		if strings.HasPrefix(name, "assets/") {
			h.Set("Cache-Control", "public, max-age=31536000, immutable") // file names contain a hash
		} else {
			h.Set("Cache-Control", "no-cache")
		}

		if data, err := fs.ReadFile(site, name+".gz"); err == nil {
			h.Add("Vary", "Accept-Encoding")
			if strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
				h.Set("Content-Encoding", "gzip")
				h.Set("Content-Length", strconv.Itoa(len(data)))
				if r.Method == http.MethodGet {
					_, _ = w.Write(data)
				}
				return
			}
			zr, err := gzip.NewReader(bytes.NewReader(data))
			if err != nil {
				http.Error(w, "corrupt file", http.StatusInternalServerError)
				return
			}
			defer zr.Close()
			if r.Method == http.MethodGet {
				_, _ = io.Copy(w, zr)
			}
			return
		}

		f, err := site.Open(name)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer f.Close()
		rs, ok := f.(io.ReadSeeker)
		if !ok {
			http.Error(w, "unreadable file", http.StatusInternalServerError)
			return
		}
		http.ServeContent(w, r, name, time.Time{}, rs) // supports Range requests (audio)
	})
}

func exists(site fs.FS, name string) bool {
	if _, err := fs.Stat(site, name); err == nil {
		return true
	}
	_, err := fs.Stat(site, name+".gz")
	return err == nil
}

func printBanner(url string) {
	line := strings.Repeat("=", 62)
	fmt.Printf(`
  %s
    PYTHON QUEST %s
  %s

  > Running at / Ejecutándose en:  %s

  Keep this window open while you learn. Close it to quit.
  Mantén esta ventana abierta mientras aprendes. Ciérrala para salir.

`, line, version, line, url)
}

func fail(msg string) {
	fmt.Fprintf(os.Stderr, "\n  ERROR: %s\n\n  Press Enter to close / Presiona Enter para cerrar.", msg)
	_, _ = fmt.Scanln()
	os.Exit(1)
}
