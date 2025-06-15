const db = require("../models")
const Appointment = db.appointment
const User = db.users
const moment = require('moment');

const createAppointment = async (req, res) => {
  try {
    const { patient, doctor, dateTime, duration, reason, type } = req.body;

    const doctorUser = await User.findById(doctor);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const patientUser = await User.findById(patient);
    if (!patientUser || patientUser.role !== 'patient') {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const appointmentDate = new Date(dateTime);
    const appointmentEnd = new Date(appointmentDate.getTime() + (duration || 30) * 60000);

    const conflictingAppointment = await Appointment.findOne({
      doctor,
      status: { $nin: ['cancelled', 'completed'] },
      $or: [
        {
          dateTime: { $lt: appointmentEnd },
          $expr: {
            $gt: [
              { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
              appointmentDate
            ]
          }
        }
      ]
    });

    if (conflictingAppointment) {
      return res.status(400).json({ message: 'Doctor is not available at this time' });
    }

    const appointment = new Appointment({
      patient,
      doctor,
      dateTime: appointmentDate,
      duration: duration || 30,
      reason,
      type: type || 'consultation',
      createdBy: req.user._id
    });

    await appointment.save();
    await appointment.populate(['patient', 'doctor', 'createdBy']);

    const io = req.app.get('io');
    io.to(`doctor-${doctor}`).emit('newAppointment', {
      appointment,
      message: `New appointment scheduled with ${patientUser.firstName} ${patientUser.lastName}`
    });

    io.to(`patient-${patient}`).emit('appointmentUpdate', {
      appointment,
      message: 'Your appointment has been scheduled'
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create appointment', error: error.message });
  }
};

const getAppointments = async (req, res) => {
  try {
    const { status, date, doctor, patient } = req.query;
    const { role, _id } = req.user;

    let filter = {};

    if (role === 'doctor') {
      filter.doctor = _id;
    } else if (role === 'patient') {
      filter.patient = _id;
    }

    if (status) filter.status = status;
    if (doctor && role === 'admin') filter.doctor = doctor;
    if (patient && ['admin', 'doctor'].includes(role)) filter.patient = patient;

    if (date) {
      const startDate = moment(date).startOf('day').toDate();
      const endDate = moment(date).endOf('day').toDate();
      filter.dateTime = { $gte: startDate, $lte: endDate };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email specialization')
      .populate('createdBy', 'firstName lastName')
      .sort({ dateTime: 1 });

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get appointments', error: error.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, _id } = req.user;

    const appointment = await Appointment.findById(id)
      .populate('patient', 'firstName lastName email phone dateOfBirth')
      .populate('doctor', 'firstName lastName email specialization')
      .populate('createdBy', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (role === 'patient' && appointment.patient._id.toString() !== _id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (role === 'doctor' && appointment.doctor._id.toString() !== _id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get appointment', error: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { role, _id } = req.user;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (role === 'patient') {
      return res.status(403).json({ message: 'Patients cannot update appointments' });
    }

    if (role === 'doctor' && appointment.doctor.toString() !== _id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (role === 'doctor') {
      const allowedFields = ['status', 'notes', 'prescription', 'diagnosis', 'vitals', 'followUpRequired', 'followUpDate'];
      Object.keys(updates).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updates[key];
        }
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate(['patient', 'doctor']);

    if (updates.status) {
      const io = req.app.get('io');
      io.to(`patient-${appointment.patient}`).emit('appointmentUpdate', {
        appointment: updatedAppointment,
        message: `Your appointment status has been updated to ${updates.status}`
      });

      if (updates.status === 'cancelled') {
        io.to(`doctor-${appointment.doctor}`).emit('appointmentCancelled', {
          appointment: updatedAppointment,
          message: 'An appointment has been cancelled'
        });
      }
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update appointment', error: error.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete appointments' });
    }

    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const io = req.app.get('io');
    io.to(`patient-${appointment.patient}`).emit('appointmentDeleted', {
      appointmentId: id,
      message: 'Your appointment has been cancelled'
    });

    io.to(`doctor-${appointment.doctor}`).emit('appointmentDeleted', {
      appointmentId: id,
      message: 'An appointment has been cancelled'
    });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete appointment', error: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
};