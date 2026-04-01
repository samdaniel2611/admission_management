const router = require('express').Router();
const Institution = require('../models/Institution');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const items = await Institution.find({ isActive: true }).sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/all', auth, authorize('admin'), async (req, res) => {
  try {
    const items = await Institution.find().sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const item = new Institution(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const item = await Institution.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Institution.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Deactivated successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
