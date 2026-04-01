const router = require('express').Router();
const AcademicYear = require('../models/AcademicYear');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const items = await AcademicYear.find().sort({ year: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/current', auth, async (req, res) => {
  try {
    const item = await AcademicYear.findOne({ isCurrent: true });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const item = new AcademicYear(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    if (req.body.isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }
    const item = await AcademicYear.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
