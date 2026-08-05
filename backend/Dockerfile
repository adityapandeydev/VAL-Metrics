# Stage 1: Build the Go microservice binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go.mod and dependencies
COPY go.mod ./
RUN go mod download || true

# Copy entire backend source code
COPY . .

# Build a completely static binary natively optimized for the server processor architecture (-s -w)
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o val-server cmd/server/main.go

# Stage 2: Create an ultra-lightweight runtime container (~20MB total footprint)
FROM alpine:3.20

# Install standard CA root certificates required to securely query Riot Games HTTPS endpoints
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy only the optimized compiled binary from Stage 1 builder
COPY --from=builder /app/val-server .

# Ensure storage directories exist for persistent encounter logs or future SQLite databases
RUN mkdir -p /app/data /app/data/vault

EXPOSE 8080

CMD ["./val-server"]
