import { Project } from '../models/Project.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/sendEmail.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

export const getMyProjects = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) throw new ApiError(404, "Employee record not found for this user");

  const projects = await Project.find({ assignedEmployees: employee._id }).populate('updates.user', 'email');
  return res.status(200).json(new ApiResponse(200, projects, "User assigned projects fetched"));
});

const progressSchema = z.object({
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional(),
  message: z.string().min(1),
});

export const updateProjectProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = progressSchema.safeParse(req.body);
  if (!result.success) throw new ApiError(400, "Validation failed", result.error.errors);

  const { status, message } = result.data;

  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) throw new ApiError(404, "Employee not found");

  const project = await Project.findOne({ _id: id, assignedEmployees: employee._id });
  if (!project) throw new ApiError(404, "Project not found or not assigned to you");

  if (status) {
    project.status = status;
    if (status === 'completed') {
      project.completedBy = employee._id;
    }
  }

  // Handle uploaded file if present
  let attachmentUrl = null;
  let fileName = null;
  
  if (req.file) {
    // Generate the full URL to the static file
    attachmentUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    fileName = req.file.originalname;
  }

  const newUpdate = {
    message,
    user: req.user._id,
    attachmentUrl,
    fileName
  };

  project.updates.push(newUpdate);
  await project.save();

  // Notify Admin of the new update
  try {
    const admins = await User.find({ role: 'admin' });
    
    for (const admin of admins) {
      const emailMessage = `
Hello Admin,

An employee has submitted a new progress update for a project.

Project: "${project.projectName}" (ID: ${project.projectId})
Employee: ${employee.name} (${employee.email})
Status Update: ${status || project.status}

Summary Message:
"${message}"

${attachmentUrl ? `📎 An attachment has been uploaded: ${fileName}\nView here: ${attachmentUrl}` : "No attachment provided."}

Best Regards,
EPMS Automation System
      `;

      await sendEmail({
        email: admin.email,
        subject: `Project Update: ${project.projectName} - ${employee.name}`,
        message: emailMessage,
      });
    }
  } catch (error) {
    logger.error(`Error sending admin notification email: ${error.message}`);
  }

  return res.status(200).json(new ApiResponse(200, project, "Project progress updated successfully"));
});
