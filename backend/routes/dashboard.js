const router = require('express').Router();
const Applicant = require('../models/Applicant');
const SeatMatrix = require('../models/SeatMatrix');
const Program = require('../models/Program');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.institution) filter.institution = req.query.institution;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;

    const matrixFilter = {};
    if (req.query.institution) matrixFilter.institution = req.query.institution;
    if (req.query.academicYear) matrixFilter.academicYear = req.query.academicYear;

    const [
      totalApplicants,
      admittedCount,
      seatAllocatedCount,
      feePendingCount,
      docsVerifiedCount,
      rejectedWithdrawnCount,
      seatMatrices,
      recentAdmissions,
      statusBreakdown
    ] = await Promise.all([
      Applicant.countDocuments(filter),
      Applicant.countDocuments({ ...filter, status: 'Admitted' }),
      Applicant.countDocuments({ ...filter, status: 'Seat Allocated' }),
      Applicant.countDocuments({ ...filter, feeStatus: 'Pending', status: { $in: ['Seat Allocated', 'Documents Verified'] } }),
      Applicant.countDocuments({ ...filter, status: 'Documents Verified' }),
      Applicant.countDocuments({ ...filter, status: { $in: ['Rejected', 'Withdrawn'] } }),
      SeatMatrix.find(matrixFilter)
        .populate('program', 'name code courseType')
        .populate('academicYear', 'year'),
      Applicant.find({ ...filter, status: 'Admitted' })
        .populate('program', 'name code')
        .sort({ admissionDate: -1 })
        .limit(5)
        .select('firstName lastName admissionNumber admissionDate program quotaType'),
      Applicant.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Compute seat summary from matrices
    let totalIntake = 0, totalAllocated = 0;
    const quotaSummary = {};
    const programWise = [];

    seatMatrices.forEach(matrix => {
      totalIntake += matrix.totalIntake;
      const programAlloc = matrix.quotas.reduce((s, q) => s + q.allocatedSeats, 0);
      totalAllocated += programAlloc;

      programWise.push({
        program: matrix.program?.name,
        programCode: matrix.program?.code,
        courseType: matrix.program?.courseType,
        totalIntake: matrix.totalIntake,
        allocated: programAlloc,
        confirmed: matrix.quotas.reduce((s, q) => s + (q.confirmedSeats || 0), 0),
        remaining: matrix.totalIntake - programAlloc,
        fillPercent: Math.round((programAlloc / matrix.totalIntake) * 100),
        quotas: matrix.quotas.map(q => ({
          name: q.name,
          type: q.type,
          total: q.totalSeats,
          allocated: q.allocatedSeats,
          confirmed: q.confirmedSeats || 0,
          available: q.totalSeats - q.allocatedSeats
        }))
      });

      matrix.quotas.forEach(q => {
        if (!quotaSummary[q.name]) quotaSummary[q.name] = { total: 0, allocated: 0, confirmed: 0 };
        quotaSummary[q.name].total += q.totalSeats;
        quotaSummary[q.name].allocated += q.allocatedSeats;
        quotaSummary[q.name].confirmed += (q.confirmedSeats || 0);
      });
    });

    // Pending documents applicants
    const pendingDocsApplicants = await Applicant.find({
      ...filter,
      'documents.status': 'Pending',
      status: { $in: ['Applied', 'Seat Allocated', 'Documents Verified'] }
    }).select('firstName lastName phone status documents').limit(10);

    res.json({
      overview: {
        totalApplicants,
        admittedCount,
        seatAllocatedCount,
        feePendingCount,
        docsVerifiedCount,
        rejectedWithdrawnCount,
        totalIntake,
        totalAllocated,
        totalRemaining: totalIntake - totalAllocated,
        fillPercent: totalIntake > 0 ? Math.round((totalAllocated / totalIntake) * 100) : 0
      },
      quotaSummary,
      programWise,
      statusBreakdown: statusBreakdown.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      recentAdmissions,
      pendingDocsApplicants
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
