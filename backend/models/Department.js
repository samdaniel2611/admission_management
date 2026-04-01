const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true },
  campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  hodName: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

departmentSchema.index({ code: 1, campus: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
