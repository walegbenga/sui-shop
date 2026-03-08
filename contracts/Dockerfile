# Optimized Sui Contract Deployment Dockerfile
FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install only runtime dependencies needed for Sui
RUN apt-get update && apt-get install -y \
    wget \
    tar \
    ca-certificates \
    libssl3 \
    libstdc++6 \
    git \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Download pre-built Sui binary
RUN wget -q https://github.com/MystenLabs/sui/releases/download/testnet-v1.14.0/sui-testnet-v1.14.0-ubuntu-x86_64.tgz \
    && tar -xzf sui-testnet-v1.14.0-ubuntu-x86_64.tgz \
    && mv sui-testnet-v1.14.0-ubuntu-x86_64/sui /usr/local/bin/sui \
    && chmod +x /usr/local/bin/sui \
    && rm -rf sui-testnet-v1.14.0-ubuntu-x86_64* \
    && sui --version

# Set working directory for contracts
WORKDIR /contracts

# Default command
CMD ["/bin/bash"]