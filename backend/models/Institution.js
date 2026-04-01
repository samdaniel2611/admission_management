const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  jkTotalLimit: { type: Number, default: 0, comment: 'J&K supernumerary cap across programs' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
