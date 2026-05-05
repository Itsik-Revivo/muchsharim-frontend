export interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  first_name_en?: string;
  last_name_en?: string;
  email: string;
  phone: string;
  department: string;
  current_role: string;
  is_licensed_engineer: number | boolean;
  engineer_license_no?: string;
  engineer_license_year?: number;
  additional_certs?: string;
  is_admin: number | boolean;
  form_sent_at?: string;
  form_submitted_at?: string;
  degrees?: Degree[];
  projects?: Project[];
  project_count?: number;
  domains?: string;
  top_degree?: string;
}

export interface Degree {
  degree_id?: number;
  employee_id?: number;
  degree_type: 'B.Sc' | 'M.Sc' | 'MBA' | 'Ph.D' | 'אחר';
  field_of_study: string;
  field_of_study_en?: string;
  institution: string;
  graduation_year: number;
}

export interface Project {
  project_id?: number;
  employee_id?: number;
  waxman_project_id?: string;
  project_name: string;
  project_name_en?: string;
  domain: 'בינוי' | 'תשתיות' | 'תב"ע';
  includes_tba?: boolean;
  project_attributes?: string[];
  floors_above?: number;
  floors_below?: number;
  description: string;
  description_en?: string;
  waxman_services?: string[];
  employee_services: string[];
  area_sqm?: number;
  client_name: string;
  client_name_en?: string;
  client_type: 'ציבורי' | 'יזם';
  financial_scope: number;
  contractor_cost?: number;
  waxman_partner_name?: string;
  waxman_service_start?: string;
  employee_service_start: string;
  waxman_service_end?: string;
  employee_service_end?: string;
  planning_start?: string;
  planning_end?: string;
  execution_start?: string;
  execution_end?: string;
  form4_date?: string;
  completion_cert_date?: string;
  road_opening_date?: string;
  referee_name?: string;
  referee_role?: string;
  referee_phone?: string;
  referee_email?: string;
}

export interface WaxmanProject extends Omit<Project, 'employee_id' | 'employee_services' | 'employee_service_start'> {
  id: string;
}

export interface Stats {
  total_employees: number;
  filled_forms: number;
  pending_forms: number;
  unsent_forms: number;
  total_projects: number;
  projects_binui: number;
  projects_tashtioth: number;
  employees_with_projects: number;
}

export interface AuthUser {
  employee_id: number;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  department: string;
  is_admin: boolean;
}

export interface EmployeeListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  employees: Employee[];
}

export const DOMAINS = ['בינוי', 'תשתיות', 'תב"ע'] as const;
export const SERVICES = ['ניהול תכנון', 'ניהול ביצוע', 'פיקוח', 'ניהול תכנית בניין עיר'] as const;
export const DEGREE_TYPES = ['B.Sc', 'M.Sc', 'MBA', 'Ph.D', 'אחר'] as const;
export const CLIENT_TYPES = ['ציבורי', 'יזם'] as const;
export const DEPARTMENTS = ['תשתיות', 'בינוי', 'תב"ע ותכנון', 'ניהול פרויקטים', 'כספים', 'משאבי אנוש'] as const;

export const BINUI_ATTRS = ['מגורים','משרדים','מסחר','דאטה סנטר','מרלו"ג','מלון','מעונות סטודנטים','מעבדה','בית חולים','דיור מוגן','מבנה ציבור','מבנה תת קרקעי'];
export const TASHTIOTH_ATTRS = ['כביש בינעירוני','כביש עירוני','פרויקט PPP','מחלף','גשר כלי רכב','גשר הולכי רגל','רכבת קלה','רכבת כבדה','תחנות רכבת','נת"צ','חניון ציבורי','מסלולי המראה','טרמינל נוסעים','נמל ים','מתקן התפלה'];
