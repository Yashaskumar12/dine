import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          // Indian phone number validation
          // Valid formats:
          // +91 1234567890
          // 1234567890
          // 01234567890
          // +91-1234567890
          // 09123456789
          if (!v) return true; // Allow empty
          return /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(v);
        },
        message: props => `${props.value} is not a valid Indian phone number!`
      }
    },
    photoURL: {
      type: String,
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zipCode: { type: String, default: '' }
    },
    locationSettings: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zipCode: { type: String, default: '' }
    },
    preferences: {
      cuisine: { type: [String], default: [] },
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 4 }
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'restaurant_owner'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    phoneVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Add indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'phoneNumber': 1 }, { unique: true, sparse: true });
UserSchema.index({ 'locationSettings.coordinates': '2dsphere' });

// Virtual for user's full name
UserSchema.virtual('fullName').get(function() {
  return this.name || this.displayName;
});

// Update the updatedAt field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
