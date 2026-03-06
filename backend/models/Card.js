const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    cardId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, default: '', trim: true },
    stamps: { type: Number, default: 0, min: 0, max: 10 },
    totalRedeemed: { type: Number, default: 0, min: 0 },
    firstStampAt: { type: Date, default: null },
    lastVisit: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);
