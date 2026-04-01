const router = require('express').Router();
const Applicant = require('../models/Applicant');
const SeatMatrix = require('../models/SeatMatrix');
const { auth, authorize } = require('../middleware/auth');

// Get all applicants with filters
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.institution) filter.institution = req.query.institution;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.program) filter.program = req.query.program;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.quotaType) filter.quotaType = req.query.quotaType;
    if (req.query.admissionMode) filter.admissionMode = req.query.admissionMode;
    if (req.query.feeStatus) filter.feeStatus = req.query.feeStatus;

    // Search by name or phone
    if (req.query.search) {
      const s = req.query.search;
      filter.$or = [
        { firstName: new RegExp(s, 'i') },
        { lastName: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
        { phone: new RegExp(s, 'i') },
        { admissionNumber: new RegExp(s, 'i') },
        { allotmentNumber: new RegExp(s, 'i') }
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Applicant.find(filter)
        .populate('program', 'name code courseType')
        .populate('institution', 'name code')
        .populate('academicYear', 'year')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Applicant.countDocuments(filter)
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single applicant
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Applicant.findById(req.params.id)
      .populate('program', 'name code courseType entryType')
      .populate('institution', 'name code')
      .populate('academicYear', 'year')
      .populate('seatMatrix')
      .populate('createdBy', 'name');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create applicant
router.post('/', auth, authorize('admin', 'admission_officer'), async (req, res) => {
  try {
    // Default documents checklist
    const defaultDocuments = [
      { name: '10th Marksheet', status: 'Pending' },
      { name: '12th Marksheet', status: 'Pending' },
      { name: 'Transfer Certificate', status: 'Pending' },
      { name: 'Migration Certificate', status: 'Pending' },
      { name: 'Category Certificate', status: 'Pending' },
      { name: 'Allotment Letter', status: 'Pending' },
      { name: 'Passport Photo', status: 'Pending' },
      { name: 'Aadhar Card', status: 'Pending' }
    ];

    const applicant = new Applicant({
      ...req.body,
      documents: req.body.documents || defaultDocuments,
      createdBy: req.user._id
    });
    await applicant.save();
    await applicant.populate('program institution academicYear', 'name code year courseType');
    res.status(201).json(applicant);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update applicant basic details
router.put('/:id', auth, authorize('admin', 'admission_officer'), async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: 'Not found' });
    if (applicant.admissionNumber) {
      // Can only update documents and fee after admission
      const allowedFields = ['documents', 'feeStatus', 'feeAmount', 'feePaidDate'];
      const update = {};
      allowedFields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
      const updated = await Applicant.findByIdAndUpdate(req.params.id, update, { new: true })
        .populate('program institution academicYear', 'name code year courseType');
      return res.json(updated);
    }
    const updated = await Applicant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('program institution academicYear', 'name code year courseType');
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update document status
router.patch('/:id/documents/:docId', auth, authorize('admin', 'admission_officer'), async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: 'Not found' });

    const doc = applicant.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.status = req.body.status;
    doc.remarks = req.body.remarks || doc.remarks;
    await applicant.save();
    res.json(applicant);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Allocate seat
router.post('/:id/allocate', auth, authorize('admin', 'admission_officer'), async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    if (applicant.status !== 'Applied') return res.status(400).json({ message: `Applicant is already in status: ${applicant.status}` });

    const { seatMatrixId } = req.body;
    const matrix = await SeatMatrix.findById(seatMatrixId);
    if (!matrix) return res.status(404).json({ message: 'Seat matrix not found' });

    // Check availability
    const hasSeats = matrix.hasAvailableSeats(applicant.quotaType);
    if (!hasSeats) return res.status(400).json({ message: `Quota "${applicant.quotaType}" is full. No seats available.` });

    // Allocate
    await matrix.allocateSeat(applicant.quotaType);

    applicant.status = 'Seat Allocated';
    applicant.seatMatrix = seatMatrixId;
    applicant.program = matrix.program;
    await applicant.save();

    await applicant.populate('program institution academicYear seatMatrix', 'name code year courseType quotas totalIntake');
    res.json({ message: 'Seat allocated successfully', applicant });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Mark fee as paid
router.patch('/:id/fee', auth, authorize('admin', 'admission_officer'), async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: 'Not found' });
    if (!['Seat Allocated', 'Documents Verified'].includes(applicant.status)) {
      return res.status(400).json({ message: 'Seat must be allocated before marking fee' });
    }

    applicant.feeStatus = 'Paid';
    applicant.feeAmount = req.body.feeAmount || applicant.feeAmount;
    applicant.feePaidDate = new Date();
    if (applicant.status === 'Documents Verified' || applicant.status === 'Seat Allocated') {
      // keep status, confirmation happens separately
    }
    await applicant.save();
    res.json({ message: 'Fee marked as paid', applicant });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
