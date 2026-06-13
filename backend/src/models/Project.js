import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  attachmentUrl: {
    type: String, // Store the HTTP URL to access the file
  },
  fileName: {
    type: String, // Store the original file name
  }
});

const projectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
  },
  projectName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  projectValue: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['planned', 'ongoing', 'completed', 'cancelled'],
    default: 'planned',
  },
  assignedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  }],
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  updates: [updateSchema],
}, { timestamps: true });

export const Project = mongoose.model('Project', projectSchema);
