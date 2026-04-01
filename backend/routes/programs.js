const router = require('express').Router();
const Program = require('../models/Program');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.department) filter.department = req.query.department;
    if (req.query.campus) filter.campus = req.query.campus;
    if (req.query.institution) filter.institution = req.query.institution;
    const items = await Program.find(filter)
      .populate('department', 'name code')
      .populate('campus', 'name code')
      .populate('institution', 'name code')
      .sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Program.findById(req.params.id)
      .populate('department campus institution', 'name code');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const item = new Program(req.body);
    await item.save();
    await item.populate('department campus institution', 'name code');
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const item = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('department campus institution', 'name code');
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Program.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
