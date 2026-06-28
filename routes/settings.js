const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Get all settings (public)
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update setting (Admin only)
router.put('/', verifyAdmin, async (req, res) => {
  try {
    const { key, value, description } = req.body;
    let setting = await Setting.findOne({ key });
    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      setting = new Setting({ key, value, description });
      await setting.save();
    }
    res.json({ success: true, message: 'Setting updated', data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update multiple settings (Admin only)
router.put('/bulk', verifyAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    for (const s of settings) {
      let setting = await Setting.findOne({ key: s.key });
      if (setting) {
        setting.value = s.value;
        if (s.description) setting.description = s.description;
        setting.updatedAt = new Date();
        await setting.save();
      } else {
        await Setting.create({ key: s.key, value: s.value, description: s.description || '' });
      }
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ QR Code Upload (Base64)
router.post('/upload-qr', verifyAdmin, async (req, res) => {
  try {
    const { qrImage } = req.body;
    if (!qrImage) return res.status(400).json({ success: false, message: 'No image provided' });

    // Save QR code as base64 in settings
    let setting = await Setting.findOne({ key: 'qrCodeImage' });
    if (setting) {
      setting.value = qrImage;
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      await Setting.create({ key: 'qrCodeImage', value: qrImage, description: 'Payment QR Code Image' });
    }

    res.json({ success: true, message: 'QR Code uploaded successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;