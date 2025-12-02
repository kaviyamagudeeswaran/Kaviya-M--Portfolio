import { Request, Response } from 'express';
import { database } from '../utils/database';
import { hashPassword } from '../utils/auth';

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const db = await database.getDb();

    // First, check if email already exists
    const existingUser = await db.collection('auth_users').findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'email_exists',
        message: 'An account with this email already exists',
      });
    }

    // Check if any admin users exist
    const adminCount = await db
      .collection('auth_users')
      .countDocuments({ role: 'admin' });
    const role = adminCount === 0 ? 'admin' : 'user';

    const hashedPassword = await hashPassword(password);
    const result = await db.collection('auth_users').insertOne({
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date(),
    });

    if (result.acknowledged) {
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        userId: result.insertedId,
        role: role,
      });
    }

    return res.status(500).json({ error: 'User creation failed unexpectedly' });
  } catch (error: any) {
    console.error(`Signup Error: ${error.message}`, error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'email_exists',
        message: 'An account with this email already exists',
      });
    }

    return res.status(500).json({
      error: 'signup_failed',
      message: 'An unexpected error occurred during signup',
    });
  }
};
