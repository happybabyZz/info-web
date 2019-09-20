export interface File {
  filename: string;
  url: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  files: string;
  created_at: Date;
  created_by: number;
  updated_at: Date;
  updated_by: number;
}

export interface NoticeData {
  notice: Notice[];
}

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  email: string;
  phone: number;
  department: string;
  class: string;
  group: string;
  role: string;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface UserData extends Partial<User> {
  loggedIn: boolean;
  token?: string;
}

export interface MentorApplication {
  id: string;
  mentor_id: number;
  student_id: number;
  statement: string;
  status: 'submitted' | 'approved' | 'rejected';
  created_at: Date;
  created_by: number;
  updated_at: Date;
  updated_by: number;
}

export interface MentorApplicationData {
  mentor_application: MentorApplication[];
}

export interface MentorAvailable {
  id: string;
  mentor_id: number;
  available: boolean;
}

export interface MentorAvailableData {
  mentor_available: MentorAvailable[];
}

export interface Message {
  id: number;
  from: number;
  to: number;
  payload: string;
  created_at: Date;
  updated_at: Date;
}

export interface MessageData {
  mentor_message: Message[];
}

export type Honor =
  | '学业优秀奖'
  | '学习进步奖'
  | '社会工作优秀奖'
  | '科技创新优秀奖'
  | '社会实践优秀奖'
  | '志愿公益优秀奖'
  | '体育优秀奖'
  | '文艺优秀奖'
  | '综合优秀奖'
  | '无校级荣誉'
  | '好读书奖';

export interface HonorApplication {
  id: string;
  honor: Honor;
  student_id: number;
  statement: string;
  attachment_url?: string;
  status: 'submitted' | 'approved' | 'rejected';
  created_at: Date;
  created_by: number;
  updated_at: Date;
  updated_by: number;
}

export interface HonorApplicationData {
  honor_application: HonorApplication[];
}
