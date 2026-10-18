//go:build !windows

package main

import "fmt"

// setupConsole sets the Terminal window title.
func setupConsole() {
	fmt.Print("\033]0;Python Quest\007")
}
