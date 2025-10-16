import express from "express";
import cors from "cors";
import multer from "multer";
import sharp from "sharp";
import fetch from "node-fetch";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 5678;
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY; // required
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 10);

if (!GOOGLE_VISION_API_KEY) {
  console.warn("⚠️  Set GOOGLE_VISION_API_KEY in your environment.");
}

const app = express();

// CORS for browser calls
app.use(cors({
  origin: "*",
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Multer (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /image\/(jpeg|png|gif|tiff?)/i.test(file.mimetype);
    cb(ok ? null : new Error("Invalid file type. Use JPEG, PNG, GIF, TIFF."), ok);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post("/webhook/image-compliance", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded (field name must be 'file').");

    const file = req.file;
    const format =
      (file.originalname.split(".").pop() || "").toLowerCase() ||
      (file.mimetype.includes("jpeg") ? "jpg"
        : file.mimetype.includes("png") ? "png"
        : file.mimetype.includes("gif") ? "gif"
        : file.mimetype.includes("tiff") ? "tiff"
        : "");

    // Get image metadata
    const meta = await sharp(file.buffer).metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;

    // Technical checks
    const techIssues = [];
    const techWarnings = [];
    const aspectRatio = width / height;
    const isSquare = aspectRatio >= 0.9 && aspectRatio <= 1.1; // Within 10% of square
    const is45DegreeShoe = false; // Will be set by Vision API if shoe is detected
    // isClothing is declared in the content analysis section

    // Format validation
    const allowed = ["jpg", "jpeg"]; // Amazon prefers JPEG
    if (!format || !allowed.includes(format)) {
      techIssues.push({ 
        code: "INVALID_FORMAT", 
        message: "Main image must be in JPEG format (RGB color mode, .jpg or .jpeg)." 
      });
    }

    // Size validation
    const minSize = 1600;
    const maxSize = 10000;
    const longest = Math.max(width, height);
    
    if (longest < minSize || longest > maxSize) {
      techIssues.push({ 
        code: "INVALID_SIZE", 
        message: `Main image must be between ${minSize}x${minSize} and ${maxSize}x${maxSize} pixels.` 
      });
    }

    // Aspect ratio validation
    if (!isSquare) {
      techWarnings.push({
        code: "ASPECT_RATIO",
        message: "For best results, use a square image (1:1 aspect ratio)."
      });
    }

    // RGB color mode check (for JPEGs)
    if (meta.space && meta.space !== 'srgb') {
      techIssues.push({
        code: "COLOR_MODE",
        message: "Image must be in RGB color mode (not CMYK)."
      });
    }

    // White background check with edge detection
    const SAMPLE = 100; // Higher sample for better edge detection
    const { data, info } = await sharp(file.buffer)
      .ensureAlpha()
      .resize(SAMPLE, SAMPLE, { fit: 'inside', position: 'center' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const edgeThreshold = 0.1; // 10% from edges
    const edgePixels = [];
    const centerPixels = [];
    
    const isEdge = (x, y, width, height) => {
      const edgeX = x < width * edgeThreshold || x > width * (1 - edgeThreshold);
      const edgeY = y < height * edgeThreshold || y > height * (1 - edgeThreshold);
      return edgeX || edgeY;
    };

    // Analyze pixels
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3] / 255;
        
        const pixel = { r, g, b, a };
        
        if (isEdge(x, y, info.width, info.height)) {
          edgePixels.push(pixel);
        } else {
          centerPixels.push(pixel);
        }
      }
    }

    // Improved white detection with tolerance for slight variations
    const isWhite = (pixel, tolerance = 10) => {
      // Calculate how close the pixel is to pure white (255,255,255)
      const rDiff = 255 - pixel.r;
      const gDiff = 255 - pixel.g;
      const bDiff = 255 - pixel.b;
      
      // Consider it white if all channels are within tolerance of 255
      return rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance;
    };

    // Check edge pixels (should be white)
    const edgeWhiteRatio = edgePixels.filter(p => isWhite(p, 15)).length / edgePixels.length;
    
    // Check center pixels (should have product, so less white)
    const centerWhiteRatio = centerPixels.filter(p => isWhite(p, 15)).length / centerPixels.length;
    
    // Calculate average color of edge pixels for better detection
    let totalR = 0, totalG = 0, totalB = 0;
    edgePixels.forEach(p => {
      totalR += p.r;
      totalG += p.g;
      totalB += p.b;
    });
    const avgR = totalR / edgePixels.length;
    const avgG = totalG / edgePixels.length;
    const avgB = totalB / edgePixels.length;
    
    // Determine background status with more flexible thresholds
    const isWhiteEnough = edgeWhiteRatio >= 0.85; // 85% of edge pixels must be white
    const isBrightEnough = (avgR + avgG + avgB) / 3 >= 240; // Average brightness check
    const isCenterDifferent = centerWhiteRatio < 0.7; // Center should be less white than edges
    
    const isBackgroundWhite = isWhiteEnough && isBrightEnough && isCenterDifferent;

    if (!isBackgroundWhite) {
      techIssues.push({
        code: 'BACKGROUND_COLOR',
        message: 'Main image must have a clean white background (RGB close to 255,255,255).',
        details: {
          edgeWhiteRatio: (edgeWhiteRatio * 100).toFixed(1) + '%',
          averageEdgeColor: `RGB(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`,
          centerWhiteRatio: (centerWhiteRatio * 100).toFixed(1) + '%',
          isWhiteEnough,
          isBrightEnough,
          isCenterDifferent
        }
      });
    } else if (edgeWhiteRatio < 0.95) {
      techWarnings.push({
        code: 'BACKGROUND_QUALITY',
        message: 'Background has some non-white pixels. For best results, use a cleaner white background.',
        details: {
          edgeWhiteRatio: (edgeWhiteRatio * 100).toFixed(1) + '%',
          averageEdgeColor: `RGB(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`
        }
      });
    }

    // Content analysis
    let contentIssues = [];
    let contentWarnings = [];
    let productCoverage = 0;
    let hasText = false;
    let hasLogos = false;
    let hasMultipleProducts = false;
    let hasMannequin = false;
    let isShoe = false;
    let isClothing = false;

    // Product coverage estimation (1 - white ratio in center)
    productCoverage = 1 - centerWhiteRatio;
    const whiteFraction = 1 - productCoverage; // Calculate white fraction for the response
    
    // Check product coverage (should be ~85% for main image)
    const minCoverage = 0.75; // 75% minimum
    const targetCoverage = 0.85; // 85% target
    const coverageDiff = Math.abs(productCoverage - targetCoverage);
    
    if (productCoverage < minCoverage) {
      contentIssues.push({
        code: 'PRODUCT_COVERAGE',
        message: `Product should cover approximately 85% of the image (currently ${(productCoverage * 100).toFixed(0)}%).`,
        details: {
          coverage: (productCoverage * 100).toFixed(1) + '%',
          recommended: '75-95%'
        }
      });
    } else if (coverageDiff > 0.1) { // More than 10% off from target
      contentWarnings.push({
        code: 'PRODUCT_COVERAGE_OPTIMAL',
        message: `For best results, product should cover approximately 85% of the image (currently ${(productCoverage * 100).toFixed(0)}%).`,
        details: {
          coverage: (productCoverage * 100).toFixed(1) + '%',
          recommended: '75-95%'
        }
      });
    }

    // Additional checks if Google Vision API is available
    if (GOOGLE_VISION_API_KEY) {
      try {
        const visionFeatures = [
          { type: 'TEXT_DETECTION' },
          { type: 'LOGO_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
          { type: 'LABEL_DETECTION' }
        ];

        const visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{
                image: { content: file.buffer.toString('base64') },
                features: visionFeatures
              }]
            })
          }
        );

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const annotations = visionData.responses?.[0] || {};
          
          // Check for text
          if (annotations.textAnnotations?.length > 0) {
            hasText = true;
            contentIssues.push({
              code: 'TEXT_DETECTED',
              message: 'No text, logos, watermarks, or other graphics are allowed on the main product image.'
            });
          }

          // Check for logos
          if (annotations.logoAnnotations?.length > 0) {
            hasLogos = true;
            contentIssues.push({
              code: 'LOGO_DETECTED',
              message: 'No brand logos, trademarks, or watermarks are allowed on the main product image.'
            });
          }

          // Check for multiple products
          if (annotations.localizedObjectAnnotations) {
            const products = annotations.localizedObjectAnnotations.filter(obj => 
              !['Human', 'Person', 'Mannequin', 'Clothing'].includes(obj.name)
            );
            
            if (products.length > 1) {
              hasMultipleProducts = true;
              contentIssues.push({
                code: 'MULTIPLE_PRODUCTS',
                message: 'Show only one unit of the product in the main image.'
              });
            }

            // Check for mannequins or models
            const people = annotations.localizedObjectAnnotations.filter(obj => 
              ['Human', 'Person', 'Mannequin'].includes(obj.name)
            );

            if (people.length > 0) {
              hasMannequin = true;
              contentIssues.push({
                code: 'MANNEQUIN_DETECTED',
                message: 'Do not show mannequins or models in the main product image (except for adult clothing).',
                details: {
                  detected: people.map(p => p.name).join(', ')
                }
              });
            }

            // Check for clothing
            const clothing = annotations.localizedObjectAnnotations.find(obj => 
              obj.name === 'Clothing' || obj.name === 'Apparel'
            );
            
            if (clothing) {
              isClothing = true;
              // If it's clothing, mannequin might be acceptable
              const mannequinIssue = contentIssues.find(i => i.code === 'MANNEQUIN_DETECTED');
              if (mannequinIssue) {
                mannequinIssue.message = 'For adult clothing, show the product on a standing model. For children\'s clothing, show the product flat.';
                mannequinIssue.severity = 'warning';
              }
            }

            // Check for shoes
            const shoe = annotations.localizedObjectAnnotations.find(obj => 
              obj.name.toLowerCase().includes('shoe') || 
              obj.name.toLowerCase().includes('footwear')
            );
            
            if (shoe) {
              isShoe = true;
              // Add specific shoe requirements
              contentWarnings.push({
                code: 'SHOE_ORIENTATION',
                message: 'For shoes, show a single shoe facing left at a 45-degree angle.'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error calling Google Vision API:', error);
        contentWarnings.push({
          code: 'VISION_API_ERROR',
          message: 'Could not complete all image validations due to an API error.'
        });
      }
    }

    // Combine all issues and warnings
    const issues = [...techIssues, ...contentIssues];
    const warnings = [...techWarnings, ...contentWarnings];
    const compliance = issues.length === 0 ? "PASS" : "FAIL";

    // Send the response with the analysis results
    res.json({
      compliance,
      issues,
      warnings,
      metrics: {
        width: info.width,
        height: info.height,
        aspectRatio: (info.width / info.height).toFixed(2),
        fileSize: file.size,
        edgeWhiteRatio: edgeWhiteRatio.toFixed(4),
        centerWhiteRatio: centerWhiteRatio.toFixed(4),
        format: file.mimetype
      },
      meta: {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }
    });
  } catch (err) {
    console.error('Error processing image:', err);
    res.status(400).json({ 
      compliance: "ERROR",
      issues: [{ 
        code: 'SERVER_ERROR', 
        message: 'Failed to process image',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }],
      warnings: [],
      metrics: {}
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    compliance: "ERROR",
    issues: [{
      code: "SERVER_ERROR",
      message: err.message || "Internal server error"
    }],
    warnings: []
  });
});

app.listen(PORT, () => {
  console.log(`✅ Image Compliance API listening on http://localhost:${PORT}`);
});
