//go:build windows

package main

import (
	"syscall"
	"unsafe"
)

// setupConsole switches the console to UTF-8 (for accents like "á") and sets its title.
func setupConsole() {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	_, _, _ = kernel32.NewProc("SetConsoleOutputCP").Call(65001)
	if title, err := syscall.UTF16PtrFromString("Python Quest"); err == nil {
		_, _, _ = kernel32.NewProc("SetConsoleTitleW").Call(uintptr(unsafe.Pointer(title)))
	}
}
