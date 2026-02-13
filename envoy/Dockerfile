FROM envoyproxy/envoy:v1.31-latest

COPY envoy.yaml /etc/envoy/envoy.yaml
COPY appointment_descriptor.pb /etc/envoy/appointment_descriptor.pb

EXPOSE 8080 9901
