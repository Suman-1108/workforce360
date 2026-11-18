import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wf360_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized states
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and user if unauthorized
      localStorage.removeItem('wf360_token');
      localStorage.removeItem('wf360_user');
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = res.data?.data || res.data;
    const token = payload?.access_token || res.data?.access_token;
    const user = payload?.user || res.data?.user;

    if (token) {
      localStorage.setItem('wf360_token', token);
    }
    if (user) {
      localStorage.setItem('wf360_user', JSON.stringify(user));
    }
    return {
      ...res.data,
      access_token: token,
      user: user,
      role: user?.role,
    };
  },
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    const payload = res.data?.data || res.data;
    const token = payload?.access_token || res.data?.access_token;
    const user = payload?.user || res.data?.user;

    if (token) {
      localStorage.setItem('wf360_token', token);
    }
    if (user) {
      localStorage.setItem('wf360_user', JSON.stringify(user));
    }
    return {
      ...res.data,
      access_token: token,
      user: user,
      role: user?.role,
    };
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateProfile: async (data: { first_name?: string; last_name?: string; phone?: string; avatar_url?: string }) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },
  changePassword: async (data: { current_password: string; new_password: string; confirm_password?: string }) => {
    const res = await api.post('/auth/change-password', data);
    return res.data;
  },
  getSessions: async () => {
    const res = await api.get('/auth/sessions');
    return res.data;
  },
  requestOtp: async (email: string, purpose = 'registration') => {
    const res = await api.post('/auth/otp/request', { email, purpose });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string, purpose = 'registration') => {
    const res = await api.post('/auth/otp/verify', { email, otp, purpose });
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('wf360_token');
    localStorage.removeItem('wf360_user');
    window.location.href = '/auth/login';
  },
};

export const employeesApi = {
  validatePhone: async (phone: string, country: string = 'IN') => {
    const res = await api.get('/employees/validate-phone', { params: { phone, country } });
    return res.data;
  },
  list: async (params?: { department_id?: number; status?: string; search?: string }) => {
    const res = await api.get('/employees', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/employees', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },
};

export const attendanceApi = {
  list: async (params?: { date?: string; employee_id?: number; status?: string }) => {
    const res = await api.get('/attendance', { params });
    return res.data;
  },
  getTodayPunchStatus: async () => {
    const res = await api.get('/attendance/today');
    return res.data?.data || res.data;
  },
  punchIn: async (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    selfie_url?: string;
    notes?: string;
  }) => {
    const res = await api.post('/attendance/punch-in', data);
    return res.data;
  },
  punchOut: async (data: {
    latitude: number;
    longitude: number;
    address?: string;
    selfie_url?: string;
    notes?: string;
  }) => {
    const res = await api.post('/attendance/punch-out', data);
    return res.data;
  },
  resetTodayPunch: async () => {
    const res = await api.post('/attendance/reset-today');
    return res.data;
  },
};

export const shiftsApi = {
  list: async () => {
    const res = await api.get('/shifts');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/shifts', data);
    return res.data;
  },
};

export const departmentsApi = {
  list: async () => {
    const res = await api.get('/departments');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/departments', data);
    return res.data;
  },
};

export const leavesApi = {
  getTypes: async () => {
    const res = await api.get('/leaves/types');
    return res.data;
  },
  list: async (params?: { status?: string }) => {
    const res = await api.get('/leaves', { params });
    return res.data;
  },
  apply: async (data: { leave_type_id: number; start_date: string; end_date: string; reason: string }) => {
    const res = await api.post('/leaves', data);
    return res.data;
  },
  action: async (id: number, action: 'Approved' | 'Rejected', rejection_reason?: string) => {
    const res = await api.post(`/leaves/${id}/action`, { action, rejection_reason });
    return res.data;
  },
};

export const uniformsApi = {
  listItems: async (params?: { category?: string; search?: string }) => {
    const res = await api.get('/uniforms/items', { params });
    return res.data;
  },
  getItem: async (id: number | string) => {
    const res = await api.get(`/uniforms/items/${id}`);
    return res.data;
  },
  addItem: async (data: any) => {
    const res = await api.post('/uniforms/items', data);
    return res.data;
  },
  updateItem: async (id: number | string, data: any) => {
    const res = await api.put(`/uniforms/items/${id}`, data);
    return res.data;
  },
  deleteItem: async (id: number | string) => {
    const res = await api.delete(`/uniforms/items/${id}`);
    return res.data;
  },
  listDistributions: async (params?: { employee_id?: number; uniform_item_id?: number; status?: string }) => {
    const res = await api.get('/uniforms/distributions', { params });
    return res.data;
  },
  issue: async (data: { employee_id: number; uniform_item_id: number; size: string; quantity: number; notes?: string }) => {
    const res = await api.post('/uniforms/issue', data);
    return res.data;
  },
  bulkIssue: async (data: {
    uniform_item_id: number;
    employee_ids?: number[];
    department_id?: number;
    branch_id?: number;
    size: string;
    quantity: number;
    issued_date?: string;
    notes?: string;
  }) => {
    const res = await api.post('/uniforms/bulk-issue', data);
    return res.data;
  },
  actionDistribution: async (distId: number, status: 'Returned' | 'Damaged' | 'Lost', notes?: string) => {
    const res = await api.post(`/uniforms/distributions/${distId}/action`, { status, notes });
    return res.data;
  },
  getMyUniforms: async () => {
    const res = await api.get('/uniforms/my-uniforms');
    return res.data;
  },
};

export const reportsApi = {
  getSummary: async () => {
    const res = await api.get('/reports/summary');
    return res.data;
  },
  getWeeklyAttendance: async () => {
    const res = await api.get('/reports/weekly-attendance');
    return res.data;
  },
  getDailyTrends: async () => {
    const res = await api.get('/reports/daily-trends');
    return res.data;
  },
  getDepartmentDistribution: async () => {
    const res = await api.get('/reports/department-distribution');
    return res.data;
  },
  getShiftDistribution: async () => {
    const res = await api.get('/reports/shift-distribution');
    return res.data;
  },
  getRecentActivity: async () => {
    const res = await api.get('/reports/recent-activity');
    return res.data;
  },
};

export const subscriptionsApi = {
  getPlans: async () => {
    const res = await api.get('/subscriptions/plans');
    return res.data;
  },
  getCurrent: async () => {
    const res = await api.get('/subscriptions/current');
    return res.data;
  },
  createCheckout: async (data: { plan_code: string; billing_cycle?: string }) => {
    const res = await api.post('/subscriptions/checkout', data);
    return res.data;
  },
  verifyRazorpay: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan_code: string;
    billing_cycle?: string;
  }) => {
    const res = await api.post('/subscriptions/razorpay/verify', data);
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/subscriptions/history');
    return res.data;
  },
  cancel: async () => {
    const res = await api.post('/subscriptions/cancel');
    return res.data;
  },
};

export const superAdminApi = {
  getStats: async () => {
    const res = await api.get('/superadmin/stats');
    return res.data?.data || res.data;
  },
  listTenants: async () => {
    const res = await api.get('/superadmin/tenants');
    return res.data?.data || res.data;
  },
  updateTenantStatus: async (tenantId: number, status: 'active' | 'suspended') => {
    const res = await api.post(`/superadmin/tenants/${tenantId}/status`, { status });
    return res.data?.data || res.data;
  },
  listPlans: async () => {
    const res = await api.get('/superadmin/plans');
    return res.data?.data || res.data;
  },
  updatePlan: async (planId: number, data: Record<string, any>) => {
    const res = await api.put(`/superadmin/plans/${planId}`, data);
    return res.data?.data || res.data;
  },
  getTelemetry: async () => {
    const res = await api.get('/superadmin/telemetry');
    return res.data?.data || res.data;
  },
};

export const organizationApi = {
  getProfile: async () => {
    const res = await api.get('/organizations/profile');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await api.put('/organizations/profile', data);
    return res.data;
  },
  listBranches: async (params?: { is_active?: boolean; search?: string }) => {
    const res = await api.get('/organizations/branches', { params });
    return res.data;
  },
};

export const settingsApi = {
  getAll: async () => {
    const res = await api.get('/organizations/settings');
    return res.data;
  },
  saveAll: async (data: any) => {
    const res = await api.put('/organizations/settings', data);
    return res.data;
  },
};

export const portalApi = {
  // Tea & Lunch Breaks
  getTodayBreaks: async (scope?: 'all') => {
    const res = await api.get('/portal/breaks/today', { params: scope ? { scope } : undefined });
    return res.data?.data || res.data;
  },
  startBreak: async (data: { break_type: 'Tea Break' | 'Lunch Break'; notes?: string }) => {
    const res = await api.post('/portal/breaks/start', data);
    return res.data?.data || res.data;
  },
  endBreak: async (notes?: string) => {
    const res = await api.post('/portal/breaks/end', notes ? { notes } : {});
    return res.data?.data || res.data;
  },

  // Today's Uniform Schedule
  getUniformToday: async () => {
    const res = await api.get('/portal/uniform-today');
    return res.data?.data || res.data;
  },
  setUniformToday: async (data: {
    date?: string;
    uniform_title: string;
    dress_code: string;
    color_theme: string;
    items_required: string;
    notes?: string;
    uniform_item_id?: number;
  }) => {
    const res = await api.post('/portal/uniform-today', data);
    return res.data?.data || res.data;
  },

  // Daily Work Updates
  listWorkUpdates: async (scope?: 'all') => {
    const res = await api.get('/portal/work-updates', { params: scope ? { scope } : undefined });
    return res.data?.data || res.data;
  },
  createWorkUpdate: async (data: {
    task_title: string;
    summary: string;
    hours_spent: number;
    progress_status: 'In Progress' | 'Completed' | 'Blocked';
  }) => {
    const res = await api.post('/portal/work-updates', data);
    return res.data?.data || res.data;
  },
  addWorkUpdateFeedback: async (updateId: number, owner_feedback: string) => {
    const res = await api.put(`/portal/work-updates/${updateId}/feedback`, { owner_feedback });
    return res.data?.data || res.data;
  },

  // Complaints & Support Tickets
  listTickets: async (scope?: 'all', status?: string) => {
    const res = await api.get('/portal/tickets', {
      params: { ...(scope ? { scope } : {}), ...(status ? { status } : {}) },
    });
    return res.data?.data || res.data;
  },
  createTicket: async (data: {
    category: 'Workplace' | 'Payroll' | 'HR' | 'Uniform & Gear' | 'IT & Equipment' | 'Safety' | 'Other';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    subject: string;
    description: string;
  }) => {
    const res = await api.post('/portal/tickets', data);
    return res.data?.data || res.data;
  },
  updateTicket: async (
    ticketId: number,
    data: { status?: 'Open' | 'In Review' | 'Resolved' | 'Closed'; owner_response?: string }
  ) => {
    const res = await api.put(`/portal/tickets/${ticketId}`, data);
    return res.data?.data || res.data;
  },

  // Salary Details & PIN-Protected Company Bank Account Vault
  getFinanceStatus: async () => {
    const res = await api.get('/portal/finance/status');
    return res.data?.data || res.data;
  },
  setFinancePin: async (pin: string, current_pin?: string) => {
    const res = await api.post('/portal/finance/set-pin', {
      pin,
      ...(current_pin ? { current_pin } : {}),
    });
    return res.data?.data || res.data;
  },
  unlockFinanceVault: async (pin: string) => {
    const res = await api.post('/portal/finance/unlock', { pin });
    return res.data?.data || res.data;
  },
  ownerGetFinanceConfig: async () => {
    const res = await api.get('/portal/owner/finance/config');
    return res.data?.data || res.data;
  },
  ownerUpdateCompanyBank: async (data: {
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    ifsc_or_routing: string;
    branch_name: string;
    account_type: string;
    upi_or_payment_ref?: string;
    payroll_cycle: string;
    security_pin?: string;
    pin_enabled: boolean;
  }) => {
    const res = await api.put('/portal/owner/company-bank', data);
    return res.data?.data || res.data;
  },
  ownerUpdateEmployeeSalary: async (
    employeeId: number,
    data: {
      basic_salary: number;
      hra_allowance: number;
      transport_allowance: number;
      other_allowances: number;
      tax_deduction: number;
      pf_deduction: number;
      other_deductions: number;
      currency: string;
      pay_frequency: string;
      last_paid_date?: string;
      payment_status: string;
      employee_bank_name?: string;
      employee_account_number?: string;
      employee_ifsc?: string;
    }
  ) => {
    const res = await api.put(`/portal/owner/salary/${employeeId}`, data);
    return res.data?.data || res.data;
  },
};
