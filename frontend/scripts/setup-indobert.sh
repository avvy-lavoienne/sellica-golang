#!/bin/bash

# SELLY IndoBERT Setup Script
# This script sets up TensorFlow Serving with IndoBERT model

echo "🚀 Setting up IndoBERT for SELLY Chatbot..."

# Create models directory
mkdir -p ./public/models
mkdir -p ./models/indobert-base/1

echo "📦 Downloading IndoBERT model..."

# Download IndoBERT model (you'll need to replace with actual model URLs)
# For now, we'll create placeholder structure
echo "Creating model structure..."

# Create model config for TensorFlow Serving
cat > ./models/models.config << EOF
model_config_list {
  config {
    name: 'indobert-base'
    base_path: '/models/indobert-base'
    model_platform: 'tensorflow'
    model_version_policy {
      latest {
        num_versions: 1
      }
    }
  }
}
EOF

echo "🐳 Setting up TensorFlow Serving with Docker..."

# Create docker-compose for TensorFlow Serving
cat > ./docker-compose.tensorflow.yml << EOF
version: '3.8'
services:
  tensorflow-serving:
    image: tensorflow/serving:latest
    ports:
      - "8501:8501"
      - "8500:8500"
    volumes:
      - ./models:/models
    command: >
      tensorflow_model_server
      --port=8500
      --rest_api_port=8501
      --model_config_file=/models/models.config
      --allow_version_labels_for_unavailable_models
    environment:
      - MODEL_NAME=indobert-base
    restart: unless-stopped
EOF

echo "📋 Setup Instructions:"
echo "1. Install Docker and Docker Compose"
echo "2. Download actual IndoBERT model files to ./models/indobert-base/1/"
echo "3. Run: docker-compose -f docker-compose.tensorflow.yml up -d"
echo "4. Restart your Next.js application"
echo ""
echo "🔗 Model Sources:"
echo "- IndoBERT: https://huggingface.co/indobenchmark/indobert-base-p1"
echo "- TensorFlow.js models: https://www.tensorflow.org/js/models"
echo ""
echo "✅ Setup script completed!"
echo "📝 Check the documentation in docs/2025-01-27_indobert-analysis-and-improvements.md for detailed instructions"
