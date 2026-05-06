import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    street: String,
    number: String,
    postal: String,
    city: String,
    province: String
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    projectCode: {
      type: String,
      required: true,
      trim: true
    },
    address: addressSchema,
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

projectSchema.index({ company: 1 });
projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });
projectSchema.index({ client: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
