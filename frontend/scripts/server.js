// server.js
    const { createServer } = require('http');
    const { parse } = require('url');
    const next = require('next');
    const compression = require('compression');
    const helmet = require('helmet');
    const path = require('path');
    const fs = require('fs');

    // Environment configuration
    const dev = process.env.NODE_ENV !== 'production';
    const port = process.env.PORT || 5678;
    const hostname = process.env.HOSTNAME || 'localhost';

    // Get the directory where the executable is located
    const dir = path.dirname(process.execPath);

    // Change to the executable directory
    process.chdir(dir);

    // Check for .next directory
    const nextDir = path.join(dir, '.next');

    if (!fs.existsSync(nextDir)) {
      process.exit(1);
    }

    // Check for public directory
    const publicDir = path.join(dir, 'public');

    if (!fs.existsSync(publicDir)) {
      process.exit(1);
    }

    // Initialize Next.js with explicit paths
    const app = next({ 
      dev: false, // Force production mode
      hostname, 
      port,
      dir: nextDir,
      conf: {
        distDir: '.next',
        serverRuntimeConfig: {
          // Will only be available on the server side
          mySecret: 'secret'
        },
        publicRuntimeConfig: {
          // Will be available on both server and client
          staticFolder: publicDir
        }
      }
    });

    const handle = app.getRequestHandler();

    // Error handling middleware
    const errorHandler = (err, req, res, next) => {
      res.statusCode = 500;
      res.end('Internal Server Error');
    };

    app.prepare().then(() => {
      const server = createServer((req, res) => {
        try {
          // Parse URL
          const parsedUrl = parse(req.url, true);
          
          // Apply security headers
          helmet()(req, res, () => {
            // Apply compression
            compression()(req, res, () => {
              // Handle Next.js requests
              handle(req, res, parsedUrl);
            });
          });
        } catch (err) {
          errorHandler(err, req, res);
        }
      });

      // Start server
      server.listen(port, (err) => {
        if (err) {
          process.exit(1);
        }
      });

      // Handle graceful shutdown
      process.on('SIGTERM', () => {
        server.close(() => {
          process.exit(0);
        });
      });
    }).catch((err) => {
      process.exit(1);
    });