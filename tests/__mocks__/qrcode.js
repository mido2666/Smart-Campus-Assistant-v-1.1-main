module.exports = {
  toDataURL: jest.fn(async (text) => `data:image/png;base64,${Buffer.from(text).toString('base64')}`)
};


