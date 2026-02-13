package grpc

import (
	"fmt"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"schedule-management-system/server/internal/grpc/interceptors"
	pb "schedule-management-system/server/proto/appointment/v1"
)

// Server wraps the gRPC server and dependencies
type Server struct {
	grpcServer *grpc.Server
	listener   net.Listener
	handler    *AppointmentHandler
}

// NewServer creates a new gRPC server
func NewServer(port string, handler *AppointmentHandler) (*Server, error) {
	listener, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		return nil, fmt.Errorf("failed to listen on port %s: %w", port, err)
	}

	// Create gRPC server with interceptors
	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			interceptors.LoggingInterceptor(),
			interceptors.ErrorHandlingInterceptor(),
		),
	)

	// Register appointment service
	pb.RegisterAppointmentServiceServer(grpcServer, handler)

	// Register reflection service (useful for grpcurl/debugging)
	reflection.Register(grpcServer)

	return &Server{
		grpcServer: grpcServer,
		listener:   listener,
		handler:    handler,
	}, nil
}

// Serve starts the gRPC server
func (s *Server) Serve() error {
	return s.grpcServer.Serve(s.listener)
}

// Stop gracefully stops the gRPC server
func (s *Server) Stop() {
	s.grpcServer.GracefulStop()
}

// Address returns the address the server is listening on
func (s *Server) Address() string {
	return s.listener.Addr().String()
}
