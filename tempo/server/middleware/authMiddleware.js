import jwt from 'jsonwebtoken';
import { getData } from '../config/jsonDb.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key_here');

      const db = await getData();
      const user = db.users.find(u => u.id === decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
      }

      // Create a user object without the password
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;

      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is invalid or expired. Please log in again.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No token provided. Please log in.' });
  }
};

export default protect;