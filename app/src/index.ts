import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger';
import process from 'process';
import populate_with_mock_data from './mockdata';
import path from 'path';
import fs from 'fs';
import { login } from './routes/login';
import { signup } from './routes/signup';
import { logout } from './routes/logout';
import { resetPassword } from './routes/resetPassword';
import { forgotPassword } from './routes/forgotPassword';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import listContactFormSubmissions from './routes/listContactFormSubmissions';
import createContactFormSubmission from './routes/createContactFormSubmission';
import getContactFormSubmission from './routes/getContactFormSubmission';
import getGitHubProfile from './routes/getGitHubProfile';
import searchRecipes from './routes/searchRecipes';
import getCurrentAuthUser from './routes/getCurrentAuthUser';
import getWeatherData from './routes/getWeatherData';


// Load environment variables
dotenv.config();

const app = express();

logger.info('Starting app server...');

// Middleware
const mockDataInitialized = (async () => {
  if (process.env.USE_MOCK === 'true') {
    console.log("Initializing mock data...");
    try {
      // Populate with mock data
      await populate_with_mock_data();
      logger.info('Mock data initialization complete');
    } catch (mockError) {
      logger.error('Mock data initialization failed:', mockError);
    }
  }
})();

app.use(async function initializeMockData(req, res, next) {
  await mockDataInitialized;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// System routes that does not require authentication
app.post('/api/signup', signup);
app.post('/api/login', login);
app.get('/api/logout', logout);
app.post('/api/forgot-password', forgotPassword);
app.post('/api/reset-password', resetPassword);

// Routes that does not require authentication
app.get('/api/contact_form_submissions', listContactFormSubmissions());
app.post('/api/contact_form_submissions', createContactFormSubmission());
app.get('/api/contact_form_submissions/:contact_form_submission_id', getContactFormSubmission());
app.get('/api/github_profile', getGitHubProfile());
app.get('/api/recipes', searchRecipes());
app.get('/api/storm/me', getCurrentAuthUser());
app.get('/api/weather', getWeatherData());



// Static file handling
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/') ||
    req.path.endsWith('.ts') ||
    req.method !== 'GET'
  ) {
    return next();
  }

  const filePath = path.join(__dirname + "/..", req.path);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return next();
    }

    const ext = path.extname(req.path).toLowerCase();

    if (ext === '.html' || ext === '') {
      return res.sendFile(filePath);
    }

    return res.sendFile(filePath);
  });
});

// JWT Verification Middleware - but skip for auth routes
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // Skip JWT verification for auth routes
  if (req.path.startsWith('/api/signup') ||
      req.path.startsWith('/api/login') ||
      req.path.startsWith('/api/logout') ||
      req.path.startsWith('/api/forgot-password') ||
      req.path.startsWith('/api/reset-password')) {
    return next();
  }

  // Get token from Authorization header (Bearer token approach)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No valid Authorization header provided',
      redirect: '/login.html'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      redirect: '/login.html'
    });
  }

  // Check if JWT_SECRET is configured
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string,
      role: string,
      email: string,
      name: string
    };

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      username: decoded.email,
    };

    return next();
  } catch (error: any) {
    logger.error('JWT verification failed:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        redirect: '/login.html'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        redirect: '/login.html'
      });
    } else {
      return res.status(401).json({
        error: 'Token verification failed',
        redirect: '/login.html'
      });
    }
  }
});

// Route handlers


// Custom middleware to filter out .ts and .json files
app.use((req: Request, res: Response, next: NextFunction) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    if (ext === '.ts' || ext === '.json') {
      res.status(404).send('File not found');
    } else {
      next();
    }
  } else {
    next();
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: `Internal Server Error: ${err.message}` });
});

// Server initialization
if (require.main === module) {
  const PORT = process.env.PORT || 5010;
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
