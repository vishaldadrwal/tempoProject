import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getData, saveData } from '../config/jsonDb.js';

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your_super_secret_key_here',
    { expiresIn: '7d' }
  );
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const db = await getData();
    const existingUser = db.users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    await saveData(db);

    const token = generateToken(newUser.id);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const db = await getData();
    const user = db.users.find(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const db = await getData();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};
