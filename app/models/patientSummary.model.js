const mongoose = require('mongoose');

const patientSummarySchema = new mongoose.Schema({
   _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  allergies: [{
    allergen: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    reaction: String
  }],
  chronicConditions: [{
    condition: String,
    diagnosedDate: Date,
    status: {
      type: String,
      enum: ['active', 'controlled', 'resolved']
    }
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  surgeries: [{
    procedure: String,
    date: Date,
    surgeon: String,
    hospital: String,
    notes: String
  }],
  familyHistory: [{
    relation: String,
    condition: String,
    ageOfOnset: Number
  }],
  lifestyle: {
    smoking: {
      type: String,
      enum: ['never', 'former', 'current']
    },
    alcohol: {
      type: String,
      enum: ['never', 'occasional', 'regular', 'heavy']
    },
    exercise: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active']
    }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    groupNumber: String
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PatientSummary', patientSummarySchema);