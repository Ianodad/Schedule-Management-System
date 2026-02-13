package interceptors

import (
	"context"
	"log"
	"time"

	"google.golang.org/grpc"
)

// LoggingInterceptor logs all gRPC requests
func LoggingInterceptor() grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		start := time.Now()

		// Call handler
		resp, err := handler(ctx, req)

		// Log request
		duration := time.Since(start)
		if err != nil {
			log.Printf("[gRPC] %s - ERROR - %v (%s)", info.FullMethod, err, duration)
		} else {
			log.Printf("[gRPC] %s - OK (%s)", info.FullMethod, duration)
		}

		return resp, err
	}
}
