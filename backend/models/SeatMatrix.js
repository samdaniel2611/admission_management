const mongoose = require('mongoose');

const quotaSchema = new mongoose.Schema({
  name: { type: String, required: true },  // KCET, COMEDK, Management
  type: { type: String, enum: ['Government', 'Management'], required: true },
  totalSeats: { type: Number, required: true, min: 0 },
  allocatedSeats: { type: Number, default: 0 },
  confirmedSeats: { type: Number, default: 0 }
}, { _id: true });

const seatMatrixSchema = new mongoose.Schema({
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  totalIntake: { type: Number, required: true },
  quotas: [quotaSchema],
  supernumerarySeats: { type: Number, default: 0 },
  supernumeraryAllocated: { type: Number, default: 0 },
  admissionMode: { type: String, enum: ['Government', 'Management', 'Both'], default: 'Both' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

seatMatrixSchema.index({ program: 1, academicYear: 1 }, { unique: true });

// Virtual: total allocated seats
seatMatrixSchema.virtual('totalAllocated').get(function() {
  return this.quotas.reduce((sum, q) => sum + q.allocatedSeats, 0);
});

// Virtual: total available
seatMatrixSchema.virtual('totalAvailable').get(function() {
  return this.totalIntake - this.quotas.reduce((sum, q) => sum + q.allocatedSeats, 0);
});

// Method: check if quota has seats
seatMatrixSchema.methods.hasAvailableSeats = function(quotaName) {
  const quota = this.quotas.find(q => q.name === quotaName);
  if (!quota) return false;
  return quota.allocatedSeats < quota.totalSeats;
};

// Method: allocate seat in quota
seatMatrixSchema.methods.allocateSeat = async function(quotaName) {
  const quota = this.quotas.find(q => q.name === quotaName);
  if (!quota) throw new Error(`Quota ${quotaName} not found`);
  if (quota.allocatedSeats >= quota.totalSeats) throw new Error(`Quota ${quotaName} is full`);
  quota.allocatedSeats += 1;
  return this.save();
};

// Method: release seat
seatMatrixSchema.methods.releaseSeat = async function(quotaName) {
  const quota = this.quotas.find(q => q.name === quotaName);
  if (!quota) throw new Error(`Quota ${quotaName} not found`);
  if (quota.allocatedSeats > 0) quota.allocatedSeats -= 1;
  return this.save();
};

// Validate total quota seats = total intake
seatMatrixSchema.pre('save', function(next) {
  const totalQuotaSeats = this.quotas.reduce((sum, q) => sum + q.totalSeats, 0);
  if (totalQuotaSeats !== this.totalIntake) {
    return next(new Error(`Total quota seats (${totalQuotaSeats}) must equal total intake (${this.totalIntake})`));
  }
  next();
});

module.exports = mongoose.model('SeatMatrix', seatMatrixSchema);
