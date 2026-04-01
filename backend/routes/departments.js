const router = require('express').Router();
const Department = require('../models/Department');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.campus) filter.campus = req.query.campus;
    if (req.query.institution) filter.institution = req.query.institution;
    const items = await Department.find(filter)
      .populate('campus', 'name code')
      .populate('institution', 'name code')
      .sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const item = new Department(req.body);
    await item.save();
    await item.populate('campus institution', 'name code');
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const item = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('campus institution', 'name code');
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Department.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
