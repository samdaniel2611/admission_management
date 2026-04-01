const mongoose = require('mongoose');

const campusSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  address: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

campusSchema.index({ code: 1, institution: 1 }, { unique: true });

module.exports = mongoose.model('Campus', campusSchema);
