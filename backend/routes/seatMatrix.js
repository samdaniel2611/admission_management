const router = require('express').Router();
const SeatMatrix = require('../models/SeatMatrix');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.program) filter.program = req.query.program;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.institution) filter.institution = req.query.institution;

    const items = await SeatMatrix.find(filter)
      .populate('program', 'name code courseType entryType')
      .populate('academicYear', 'year')
      .populate('institution', 'name code')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const item = await SeatMatrix.findById(req.params.id)
      .populate('program', 'name code courseType entryType')
      .populate('academicYear', 'year')
      .populate('institution', 'name code');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const existing = await SeatMatrix.findOne({ program: req.body.program, academicYear: req.body.academicYear });
    if (existing) return res.status(400).json({ message: 'Seat matrix already exists for this program and year' });

    const item = new SeatMatrix(req.body);
    await item.save();
    await item.populate('program academicYear institution', 'name code year courseType entryType');
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const existing = await SeatMatrix.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    // Check if any seats are already allocated
    const totalAllocated = existing.quotas.reduce((sum, q) => sum + q.allocatedSeats, 0);
    if (totalAllocated > 0 && req.body.quotas) {
      return res.status(400).json({ message: 'Cannot modify quotas after seats have been allocated' });
    }

    const item = await SeatMatrix.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('program academicYear institution', 'name code year courseType entryType');
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Check seat availability for a specific quota
router.get('/:id/availability/:quotaName', auth, async (req, res) => {
  try {
    const matrix = await SeatMatrix.findById(req.params.id);
    if (!matrix) return res.status(404).json({ message: 'Seat matrix not found' });

    const quota = matrix.quotas.find(q => q.name === req.params.quotaName);
    if (!quota) return res.status(404).json({ message: 'Quota not found' });

    res.json({
      quotaName: quota.name,
      totalSeats: quota.totalSeats,
      allocatedSeats: quota.allocatedSeats,
      availableSeats: quota.totalSeats - quota.allocatedSeats,
      isAvailable: quota.allocatedSeats < quota.totalSeats
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
