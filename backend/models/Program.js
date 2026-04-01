const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  courseType: { type: String, enum: ['UG', 'PG'], required: true },
  entryType: { type: String, enum: ['Regular', 'Lateral'], required: true },
  duration: { type: Number, default: 4, comment: 'in years' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

programSchema.index({ code: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Program', programSchema);
