const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'diamond11secretkey2024');
    req.userId = decoded.id;
    req.uid = decoded.uid;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'diamond11secretkey2024');
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    req.adminId = admin._id;
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
};

module.exports = { verifyToken, verifyAdmin };