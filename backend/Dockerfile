FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

# Set non-interactive timezone/env
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install Python 3.11 and system dependencies for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set python aliases
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-cache SD-Turbo model weights during build to speed up cold starts
RUN python -c "from diffusers import AutoPipelineForText2Image; import torch; AutoPipelineForText2Image.from_pretrained('stabilityai/sd-turbo', torch_dtype=torch.float16)" || true

# Copy backend source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
