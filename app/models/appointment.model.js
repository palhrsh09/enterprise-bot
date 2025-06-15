const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
   _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 30 
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'check-up', 'emergency'],
    default: 'consultation'
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  prescription: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  vitals: {
    bloodPressure: String,
    temperature: String,
    heartRate: String,
    weight: String,
    height: String
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

appointmentSchema.index({ patient: 1, dateTime: 1 });
appointmentSchema.index({ doctor: 1, dateTime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ dateTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);