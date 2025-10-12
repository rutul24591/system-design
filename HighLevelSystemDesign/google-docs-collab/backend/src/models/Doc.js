const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocSchema = new Schema({
  docId: { type: String, unique: true },
  title: { type: String, default: 'Untitled' },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  snapshot: { type: String }, // base64 encoded binary snapshot
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doc', DocSchema);