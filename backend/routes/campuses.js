const router = require('express').Router();
const Campus = require('../models/Campus');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.institution) filter.institution = req.query.institution;
    const items = await Campus.find(filter).populate('institution', 'name code').sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const item = new Campus(req.body);
    await item.save();
    await item.populate('institution', 'name code');
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const item = await Campus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('institution', 'name code');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Campus.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
