const express = require('express');
const router = express.Router();
const Card = require('../models/Card');

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const STAMPS_NEEDED = 10;

function generateCardId(customerName) {
  const namePart = customerName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  const num = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `${namePart}-${num}`;
}

function hasExpired(firstStampAt) {
  if (!firstStampAt) return false;
  return Date.now() - new Date(firstStampAt).getTime() > EXPIRY_MS;
}

// POST /api/cards — Create new card
router.post('/', async (req, res) => {
  try {
    const { customerName, phoneNumber } = req.body;
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    let cardId;
    let attempts = 0;
    do {
      cardId = generateCardId(customerName);
      attempts++;
    } while ((await Card.exists({ cardId })) && attempts < 20);

    const card = await Card.create({
      cardId,
      customerName: customerName.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
    });

    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards — List all cards
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find().sort({ lastVisit: -1, createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/:cardId — Get one card
router.get('/:cardId', async (req, res) => {
  try {
    const card = await Card.findOne({ cardId: req.params.cardId });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards/:cardId/stamp — Add stamp (with expiry/reset logic)
router.post('/:cardId/stamp', async (req, res) => {
  try {
    const card = await Card.findOne({ cardId: req.params.cardId });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const now = new Date();

    if (card.stamps === 0 || !card.firstStampAt) {
      // Fresh card or previously reset
      card.stamps = 1;
      card.firstStampAt = now;
    } else if (hasExpired(card.firstStampAt)) {
      // 30 days passed — silent reset, start fresh cycle
      card.stamps = 1;
      card.firstStampAt = now;
    } else {
      // Valid window — increment
      card.stamps += 1;
    }

    card.lastVisit = now;
    await card.save();

    const freeEarned = card.stamps === STAMPS_NEEDED;
    const expiryDate = new Date(card.firstStampAt.getTime() + EXPIRY_MS);

    res.json({
      card,
      freeEarned,
      stampsRemaining: STAMPS_NEEDED - card.stamps,
      expiryDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards/:cardId/redeem — Give free scoop and reset
router.post('/:cardId/redeem', async (req, res) => {
  try {
    const card = await Card.findOne({ cardId: req.params.cardId });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    card.stamps = 0;
    card.firstStampAt = null;
    card.totalRedeemed += 1;
    card.lastVisit = new Date();
    await card.save();

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cards/:cardId — Delete a card
router.delete('/:cardId', async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ cardId: req.params.cardId });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
