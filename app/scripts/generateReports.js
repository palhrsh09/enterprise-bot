const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

function generateAppointmentReport(appointment) {
  const doc = new PDFDocument();

  doc.fontSize(20).text('Appointment Summary Report', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Patient ID: ${appointment?.patientId}`);
  doc.text(`Doctor ID: ${appointment?.doctorId}`);
  doc.text(`Appointment Date: ${appointment?.dateTime}`);
  doc.text(`Duration: ${appointment?.duration} minutes`);
  doc.text(`Type: ${appointment?.type}`);
  doc.text(`Reason: ${appointment?.reason}`);
  doc.text(`Diagnosis: ${appointment?.diagnosis || 'N/A'}`);
  doc.text(`Prescription: ${appointment?.prescription || 'N/A'}`);
  doc.text(`Notes: ${appointment?.notes || 'N/A'}`);
  doc.moveDown();

  if (appointment?.vitals) {
    doc.text('Vitals:');
    doc.text(`  Blood Pressure: ${appointment?.vitals?.bloodPressure || 'N/A'}`);
    doc.text(`  Temperature: ${appointment?.vitals?.temperature || 'N/A'}`);
    doc.text(`  Heart Rate: ${appointment?.vitals?.heartRate || 'N/A'}`);
    doc.text(`  Weight: ${appointment?.vitals?.weight || 'N/A'}`);
    doc.text(`  Height: ${appointment?.vitals?.height || 'N/A'}`);
  }

  doc.end();

  return Readable.from(doc);
}

module.exports = generateAppointmentReport;
