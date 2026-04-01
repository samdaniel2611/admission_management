const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Submitted', 'Verified'], default: 'Pending' },
  remarks: { type: String }
}, { _id: true });

const applicantSchema = new mongoose.Schema({
  // Personal Details
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },

  // Academic Details
  category: { type: String, enum: ['GM', 'SC', 'ST', 'OBC', 'EWS', 'PWD'], required: true },
  entryType: { type: String, enum: ['Regular', 'Lateral'], required: true },
  qualifyingExam: { type: String, required: true },
  qualifyingMarks: { type: Number, required: true },
  qualifyingPercentage: { type: Number, required: true },

  // Admission Details
  quotaType: { type: String, required: true },  // KCET, COMEDK, Management
  admissionMode: { type: String, enum: ['Government', 'Management'], required: true },
  allotmentNumber: { type: String },  // For government flow
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },

  // Status
  status: {
    type: String,
    enum: ['Applied', 'Seat Allocated', 'Documents Verified', 'Fee Paid', 'Admitted', 'Rejected', 'Withdrawn'],
    default: 'Applied'
  },

  // Documents
  documents: [documentSchema],

  // Fee
  feeStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  feeAmount: { type: Number },
  feePaidDate: { type: Date },

  // Admission
  admissionNumber: { type: String, unique: true, sparse: true },
  admissionDate: { type: Date },
  seatMatrix: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatMatrix' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Virtual: full name
applicantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Applicant', applicantSchema);
