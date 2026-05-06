# Use a slim Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (needed for some Python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create a placeholder for the .env file if it doesn't exist
# Production environment variables should be set in the platform (Render/Railway)
RUN touch .env

# Expose the FastAPI port
EXPOSE 8000

# Start the application using uvicorn
# We run it from the root so it can find the backend package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
