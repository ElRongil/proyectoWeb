import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    name: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    nif: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'guest'],
      default: 'admin'
    },
    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending'
    },
    verificationCode: {
      type: String
    },
    verificationAttempts: {
      type: Number,
      default: 3
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    address: {
      street: String,
      number: String,
      postal: String,
      city: String,
      province: String
    },
    refreshToken: {
      type: String,
      select: false
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true }
  }
);

userSchema.index({ company: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

userSchema.virtual('fullName').get(function () {
  return `${this.name} ${this.lastName}`;
});

const User = mongoose.model('User', userSchema);

export default User;