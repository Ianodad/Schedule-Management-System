package interceptors

import (
	"context"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ErrorHandlingInterceptor handles panics and converts them to gRPC errors
func ErrorHandlingInterceptor() grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (resp interface{}, err error) {
		// Recover from panics
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] %s - %v", info.FullMethod, r)
				err = status.Error(codes.Internal, "internal server error")
			}
		}()

		return handler(ctx, req)
	}
}
