const express = require('express');
const router = express.Router();
const Doc = require('../models/Doc');
const { authMiddleware } = require('../middleware/auth');

// create doc
router.post('/', authMiddleware, async (req, res) => {
  const { title } = req.body;
  const doc = new Doc({ title, owner: req.user.id });
  await doc.save();
  res.json(doc);
});

// list docs
router.get('/', authMiddleware, async (req, res) => {
  const docs = await Doc.find({ owner: req.user.id });
  res.json(docs);
});

// get doc metadata
router.get('/:docId', authMiddleware, async (req, res) => {
  const doc = await Doc.findOne({ docId: req.params.docId });
  if (!doc) return res.status(404).send('Not found');
  res.json(doc);
});

module.exports = router;