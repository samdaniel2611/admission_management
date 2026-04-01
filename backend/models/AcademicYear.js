const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  year: { type: String, required: true, unique: true },  // e.g. "2025-26"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  isCurrent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
