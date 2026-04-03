FROM golang:1.25-bookworm AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/kasir-api ./cmd/server

FROM debian:bookworm-slim

WORKDIR /app

ENV PORT=8000
ENV DB_PATH=kasir.db
ENV UPLOAD_DIR=uploads

COPY --from=builder /out/kasir-api /app/kasir-api

EXPOSE 8000

CMD ["/app/kasir-api"]
