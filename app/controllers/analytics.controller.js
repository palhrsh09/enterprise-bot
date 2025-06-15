const db = require('../models');
const Appointment = db.appointment
const mongoose = require('mongoose');

exports.getPatientAnalytics = async (req, res) => {
  const { patientId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({ message: 'Invalid patient ID' });
  }

  try {
    const objectId = new mongoose.Types.ObjectId(patientId);

    const totalAppointments = await Appointment.countDocuments({ patientId: objectId });
    // console.log()
    const statusDistribution = await Appointment.aggregate([
      { $match: { patient: objectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const typeDistribution = await Appointment.aggregate([
      { $match: { patient: objectId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 14);

    const dailyTrend = await Appointment.aggregate([
      {
        $match: {
          patient: objectId,
          dateTime: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dateTime" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const upcomingAppointments = await Appointment.find({
      patient: objectId,
      dateTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    }).sort({ dateTime: 1 }).limit(5);

    const lastCompleted = await Appointment.findOne({
      patient: objectId,
      status: 'completed'
    }).sort({ dateTime: -1 });

    res.json({
      totalAppointments,
      statusDistribution,
      typeDistribution,
      dailyTrend,
      upcomingAppointments,
      lastCompleted
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching patient analytics', error: err.message });
  }
};
