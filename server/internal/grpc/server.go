package grpc

import (
	"fmt"
	"net"

	gogrpc "google.golang.org/grpc"

	appointmentv1 "schedule-management-system/server/gen/appointment/v1"
	"schedule-management-system/server/internal/grpc/interceptors"
)

type Server struct {
	grpcServer *gogrpc.Server
	listener   net.Listener
}

func NewServer(addr string, appointmentService appointmentv1.AppointmentServiceServer) (*Server, error) {
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return nil, fmt.Errorf("listen on %s: %w", addr, err)
	}

	grpcServer := gogrpc.NewServer(
		gogrpc.ChainUnaryInterceptor(
			interceptors.LoggingUnaryInterceptor(),
			interceptors.ErrorUnaryInterceptor(),
		),
	)
	appointmentv1.RegisterAppointmentServiceServer(grpcServer, appointmentService)

	return &Server{
		grpcServer: grpcServer,
		listener:   listener,
	}, nil
}

func (s *Server) Serve() error {
	return s.grpcServer.Serve(s.listener)
}

func (s *Server) GracefulStop() {
	s.grpcServer.GracefulStop()
}

func (s *Server) Stop() {
	s.grpcServer.Stop()
}
