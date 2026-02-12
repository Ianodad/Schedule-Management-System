export interface GrpcConfig {
  baseUrl: string
}

let config: GrpcConfig = {
  baseUrl: import.meta.env.VITE_GRPC_BASE_URL ?? 'http://localhost:8080',
}

export function setGrpcConfig(next: Partial<GrpcConfig>): void {
  config = { ...config, ...next }
}

export function getGrpcConfig(): GrpcConfig {
  return config
}
