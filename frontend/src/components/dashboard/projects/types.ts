// Shared type definitions for Projects feature

export interface TeamMember {
  userId?: { _id?: string; name?: string; email?: string } | string;
  name?: string;
  role?: string;
}

export interface Attachment {
  filename?: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
  path?: string;
  uploadedBy?: string;
}

export interface Project {
  _id: string;
  projectTitle: string;
  description?: string;
  owner?: { _id?: string; name?: string; email?: string } | string;
  assignedTeam?: TeamMember[];
  status: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  completionPercentage?: number;
  riskLevel?: string;
  attachments?: Attachment[];
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}
