import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Project } from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/sendEmail.js';
import { z } from 'zod';
import crypto from 'crypto';

// Function to generate a strong temporary password
const generateTemporaryPassword = (name, dob) => {
  // Generate random password with uppercase, lowercase, numbers, and special char
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  const chars = uppercase + lowercase + numbers;
  let password = '';

  // Get initials from name (uppercase)
  const initials = name.split(/\s+/).filter(Boolean).map(word => word[0].toUpperCase()).join('');

  // Extract date parts
  const [yyyy, mm, dd] = dob.split('-');

  // Build password: Initials + DD + MM + Random chars
  password = initials + dd + mm;

  // Add random numbers to ensure complexity
  const randomNums = crypto.randomBytes(2).toString('hex').substring(0, 2);
  password += randomNums.toUpperCase();

  return password;
};

// ======= EMPLOYEE MANAGEMENT =======

const createEmployeeSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  dateOfBirth: z.string(),
  joiningDate: z.string(),
  phone: z.string().min(10),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.string(),
  department: z.string(),
  designation: z.string(),
  basicPay: z.number().min(0),
});

export const createEmployee = asyncHandler(async (req, res) => {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
  console.log("Trying to send email to:", options.email);
  const result = createEmployeeSchema.safeParse(req.body);
  if (!result.success) {
    const errorMsgs = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(' | ');
    throw new ApiError(400, `Validation failed: ${errorMsgs}`, result.error.errors);
  }

  const { employeeId, name, email, dateOfBirth, joiningDate, phone, gender, bloodGroup, department, designation, basicPay } = result.data;

  // Auto-generate login password with better complexity
  const autoPassword = generateTemporaryPassword(name, dateOfBirth);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "User with this email already exists");

  const existingEmployee = await Employee.findOne({ employeeId });
  if (existingEmployee) throw new ApiError(409, "Employee ID already exists");

  const user = await User.create({ email, password: autoPassword, role: 'employee' });

  const employee = await Employee.create({
    user: user._id, employeeId, name, email, dateOfBirth, joiningDate, phone, gender, bloodGroup, department, designation, basicPay
  });

  // Dispatch Welcome Email
  const emailMessage = `
Dear ${name},

Welcome to the team! Your employee profile has been successfully created.

Here are your login credentials for the Employee Portal:
Login Email: ${email}
Password: ${autoPassword}

IMPORTANT: Please log in and change your password to something secure that only you know.

If you forget your password, you can reset it using the "Forgot Password" option on the login page.

You can also login using Google Sign-In if available.

Best Regards,
HR Department
  `;

  console.log("Employee created");
  console.log("Sending email to:", email);

  try {
    await sendEmail({
      email: email,
      subject: "Welcome to the Company - Your Login Credentials",
      message: emailMessage,
    });

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        ...employee.toObject(),
        loginEmail: email,
        loginPassword: autoPassword,
      },
      "Employee created successfully"
    )
  );
});

export const getEmployees = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const employees = await Employee.find().skip(skip).limit(limit).populate('user', 'email role');
  const total = await Employee.countDocuments();

  return res.status(200).json(new ApiResponse(200, { employees, total, page, totalPages: Math.ceil(total / limit) }, "Employees fetched"));
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (updates.password) delete updates.password; // Admin doesn't update password easily here

  const employee = await Employee.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!employee) throw new ApiError(404, "Employee not found");

  return res.status(200).json(new ApiResponse(200, employee, "Employee updated successfully"));
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employee = await Employee.findById(id);
  if (!employee) throw new ApiError(404, "Employee not found");

  await User.findByIdAndDelete(employee.user);
  await Employee.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, null, "Employee deleted"));
});

// ======= PROJECT MANAGEMENT =======

const createProjectSchema = z.object({
  projectId: z.string().min(1),
  projectName: z.string().min(2),
  description: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  projectValue: z.number().min(0),
});

export const createProject = asyncHandler(async (req, res) => {
  const result = createProjectSchema.safeParse(req.body);
  if (!result.success) throw new ApiError(400, "Validation failed", result.error.errors);

  const existingProject = await Project.findOne({ projectId: result.data.projectId });
  if (existingProject) throw new ApiError(409, "Project ID already exists");

  const project = await Project.create(result.data);
  return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().populate('assignedEmployees', 'name employeeId').populate('updates.user', 'email');
  return res.status(200).json(new ApiResponse(200, projects, "Projects fetched"));
});

export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!project) throw new ApiError(404, "Project not found");
  return res.status(200).json(new ApiResponse(200, project, "Project updated successfully"));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findByIdAndDelete(id);
  if (!project) throw new ApiError(404, "Project not found");
  return res.status(200).json(new ApiResponse(200, null, "Project deleted"));
});

export const assignProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeIds } = req.body; // Array of employee document IDs

  const project = await Project.findByIdAndUpdate(id, { $addToSet: { assignedEmployees: { $each: employeeIds } } }, { new: true });
  if (!project) throw new ApiError(404, "Project not found");

  // Send Email Notification to Assigned Employees
  try {
    const employees = await Employee.find({ _id: { $in: employeeIds } });

    for (const employee of employees) {
      const emailMessage = `
Hi ${employee.name},

You have been assigned to a new project: "${project.projectName}".

Project Details:
- Project ID: ${project.projectId}
- Start Date: ${new Date(project.startDate).toLocaleDateString()}
- Deadline: ${new Date(project.endDate).toLocaleDateString()}

Please log in to the Employee Portal to view more details and start submitting progress updates.

Best Regards,
Project Management Team
      `;

      // Do NOT await this so the UI doesn't hang
      sendEmail({
        email: employee.email,
        subject: `New Project Assigned: ${project.projectName}`,
        message: emailMessage,
      });
    }
  } catch (error) {
    console.error("Error sending assignment emails:", error.message);
  }

  return res.status(200).json(new ApiResponse(200, project, "Project assigned successfully"));
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalEmployees = await Employee.countDocuments();
  const totalProjects = await Project.countDocuments();
  const completedProjects = await Project.countDocuments({ status: 'completed' });
  const ongoingProjects = await Project.countDocuments({ status: 'ongoing' });

  return res.status(200).json(new ApiResponse(200, {
    totalEmployees, totalProjects, completedProjects, ongoingProjects
  }, "Stats fetched"));
});
