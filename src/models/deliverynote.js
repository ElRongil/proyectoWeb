import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hours: { type: Number, required: true }
  },
  { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
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
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    format: {
      type: String,
      enum: ['material', 'hours'],
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    workDate: {
      type: Date,
      required: true
    },
    // Campos para format: 'material'
    material: String,
    quantity: Number,
    unit: String,
    // Campos para format: 'hours'
    hours: Number,
    workers: [workerSchema],
    // Firma
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    signatureUrl: String,
    pdfUrl: String,
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

deliveryNoteSchema.index({ company: 1 });
deliveryNoteSchema.index({ project: 1 });
deliveryNoteSchema.index({ client: 1 });
deliveryNoteSchema.index({ workDate: -1 });

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);

export default DeliveryNote;
