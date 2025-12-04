const nodemailer = {
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' })
  }))
};

module.exports = nodemailer;


