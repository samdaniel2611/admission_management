const router = require('express').Router();
const Applicant = require('../models/Applicant');
const Program = require('../models/Program');
const AcademicYear = require('../models/AcademicYear');
const SeatMatrix = require('../models/SeatMatrix');
const { auth, authorize } = require('../middleware/auth');

// Generate unique admission number
async function generateAdmissionNumber(applicant) {
  const program = await Program.findById(applicant.program).populate('institution', 'code').populate('department', 'code');
  const year = await AcademicYear.findById(applicant.academicYear);

  if (!program || !year) throw new Error('Program or Academic Year not found');

  const instCode = program.institution.code;
  const yearStr = year.year.split('-')[0]; // e.g. "2025" from "2025-26"
  const courseType = program.courseType; // UG / PG
  const progCode = program.code; // e.g. CSE
  const quota = applicant.quotaType.toUpperCase(); // KCET / COMEDK / MGMT

  // Count existing admissions for this combination to get sequence
  const prefix = `${instCode}/${yearStr}/${courseType}/${progCode}/${quota}/`;
  const existing = await Applicant.countDocuments({
    admissionNumber: new RegExp(`^${prefix.replace(/\//g, '\\/')}`)
  });
  const seq = String(existing + 1).padStart(4, '0');

  return `${prefix}${seq}`;
}

// Confirm admission
router.post('/:id/confirm', auth, authorize('admin', 'admission_officer'), async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    if (applicant.admissionNumber) return res.status(400).json({ message: 'Admission already confirmed', admissionNumber: applicant.admissionNumber });

    // All checks
    if (!['Seat Allocated', 'Documents Verified'].includes(applicant.status)) {
      return res.status(400).json({ message: 'Seat must be allocated before confirming admission' });
    }
    if (applicant.feeStatus !== 'Paid') {
      return res.status(400).json({ message: 'Fee must be paid before confirming admission' });
    }

    // Check all documents verified (optional strict mode)
    const pendingDocs = applicant.documents.filter(d => d.status === 'Pending');
    if (pendingDocs.length > 0 && req.body.strictDocCheck) {
      return res.status(400).json({ message: `${pendingDocs.length} document(s) still pending verification` });
    }

    const admissionNumber = await generateAdmissionNumber(applicant);
    applicant.admissionNumber = admissionNumber;
    applicant.admissionDate = new Date();
    applicant.status = 'Admitted';

    // Update seat matrix confirmed count
    if (applicant.seatMatrix) {
      const matrix = await SeatMatrix.findById(applicant.seatMatrix);
      if (matrix) {
        const quota = matrix.quotas.find(q => q.name === applicant.quotaType);
        if (quota) {
          quota.confirmedSeats = (quota.confirmedSeats || 0) + 1;
          await matrix.save();
        }
      }
    }

    await applicant.save();
    await applicant.populate('program institution academicYear', 'name code year courseType');

    res.json({
      message: 'Admission confirmed successfully',
      admissionNumber,
      applicant
    });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Reject / Withdraw admission
router.patch('/:id/status', auth, authorize('admin', 'admission_officer'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['Rejected', 'Withdrawn'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use Rejected or Withdrawn' });
    }

    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: 'Not found' });
    if (applicant.status === 'Admitted') {
      return res.status(400).json({ message: 'Cannot change status of confirmed admission' });
    }

    // Release seat if allocated
    if (applicant.seatMatrix && applicant.status === 'Seat Allocated') {
      const matrix = await SeatMatrix.findById(applicant.seatMatrix);
      if (matrix) await matrix.releaseSeat(applicant.quotaType);
    }

    applicant.status = status;
    await applicant.save();
    res.json({ message: `Applicant marked as ${status}`, applicant });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Get admitted students list
router.get('/admitted', auth, async (req, res) => {
  try {
    const filter = { status: 'Admitted' };
    if (req.query.institution) filter.institution = req.query.institution;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.program) filter.program = req.query.program;

    const items = await Applicant.find(filter)
      .populate('program', 'name code courseType')
      .populate('institution', 'name code')
      .populate('academicYear', 'year')
      .sort({ admissionDate: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
