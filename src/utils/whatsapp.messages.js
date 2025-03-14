// whatsapp.messages.js - Updated version
const generateConfirmationMessage = (doctorName, date, time, recipientName) => {
  // For approved template messages, we need to use this format
  return {
    template: 'appointment_confirmation',
    language: 'es', // Spanish
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: recipientName },
          { type: 'text', text: doctorName },
          { type: 'text', text: date },
          { type: 'text', text: time }
        ]
      }
    ]
  };
};

const generateCancellationMessage = (doctorName, date, recipientName) => {
  return {
    template: 'appointment_cancellation',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: recipientName },
          { type: 'text', text: doctorName },
          { type: 'text', text: date }
        ]
      }
    ]
  };
};

const generateRescheduleMessage = (doctorName, oldDate, newDate, time, recipientName) => {
  return {
    template: 'appointment_rescheduled',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: recipientName },
          { type: 'text', text: doctorName },
          { type: 'text', text: newDate },
          { type: 'text', text: time },
          { type: 'text', text: oldDate }
        ]
      }
    ]
  };
};

const generateReminderMessage = (doctorName, date, time, recipientName) => {
  return {
    template: 'appointment_reminder',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: recipientName },
          { type: 'text', text: doctorName },
          { type: 'text', text: date },
          { type: 'text', text: time }
        ]
      }
    ]
  };
};

module.exports = {
  generateConfirmationMessage,
  generateCancellationMessage,
  generateRescheduleMessage,
  generateReminderMessage,
};