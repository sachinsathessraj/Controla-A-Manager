# Image Compliance Service

This is a backend service for analyzing product images for Amazon compliance requirements.

## Features

- Image upload and processing
- Technical validation (format, size, dimensions)
- White background detection
- Google Vision API integration (optional)
- Compliance reporting

## Prerequisites

- Node.js 16+ and npm
- Google Cloud Vision API key (optional for basic functionality)

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the backend directory:
   ```env
   PORT=5678
   GOOGLE_VISION_API_KEY=your-google-vision-api-key
   MAX_UPLOAD_MB=10
   ```

## Running the Service

### Development Mode
```bash
# Start with auto-reload
npm run dev
```

### Production Mode
```bash
npm start
```

The service will be available at `http://localhost:5678`

## API Endpoints

- `POST /webhook/image-compliance` - Upload and analyze an image
- `GET /health` - Health check endpoint

## Environment Variables

- `PORT` - Port to run the server on (default: 5678)
- `GOOGLE_VISION_API_KEY` - Google Cloud Vision API key (optional)
- `MAX_UPLOAD_MB` - Maximum file size in MB (default: 10)

## Frontend Integration

The frontend should be configured to send requests to `http://localhost:5678/webhook/image-compliance` by default. You can override this by setting the `REACT_APP_API_URL` environment variable in the frontend's `.env` file.

## Deployment

For production deployment, consider using:
- PM2 for process management
- Nginx as a reverse proxy
- Environment variables for configuration
