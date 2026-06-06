const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    loginLockdown: { type: Boolean, default: false },
    lockdownMessage: {
      type: String,
      default: 'Platform is in emergency lockdown. Only administrators may sign in.',
    },
    maintenanceMode: { type: Boolean, default: false },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
