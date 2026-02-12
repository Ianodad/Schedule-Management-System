package logger

import "log"

func Infof(format string, v ...any) {
	log.Printf("INFO: "+format, v...)
}

func Errorf(format string, v ...any) {
	log.Printf("ERROR: "+format, v...)
}
