const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', auth, (req, res) => res.json(req.user));

// Create user (admin only)
router.post('/register', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User created', user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (admin only)
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.put('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, role, isActive }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;