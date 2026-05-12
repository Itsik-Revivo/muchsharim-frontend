'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getStats, listEmployees, listProjects, getEmployee, sendForms, toggleActive, getExpiringLicenses, exportUrl } from '@/lib/api';
import Navbar from '@/components/ui/Navbar';
import { Card, CardTitle, Button, Field, Input, Select, Alert, Loading, Empty, DomainBadge, StatusPill, Avatar, Badge, StatCard } from '@/components/ui';
import type { Stats, Employee, EmployeeListResponse, Project, ProjectListResponse } from '@/types';
import { Search, Download, Send, ChevronLeft, AlertTriangle, ToggleLeft, ToggleRight, Users, FolderOpen } from 'lucide-react';

type ViewMode = 'employees' | 'projects' | 'profile' | 'expiring';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [empResult, setEmpResult] = useState<EmployeeListResponse | null>(null);
  const [projResult, setProjResult] = useState<ProjectListResponse | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [expiringEmps, setExpiringEmps] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('employees');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [filters, setFilters] = useState({
    domain:'', is_licensed_engineer:'', is_licensed_professional:'',
    license_status:'', education_type:'', employer_name:'',
    service:'', project_type:'', name:'', is_waxman:'',
  });

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (!authLoading && user && !user.is_admin) router.replace('/employee');
  }, [user, authLoading, router]);

  const loadStats = useCallback(async () => {
    if (!user?.is_admin) return;
    const s: any = await getStats();
    setStats(s);
  }, [user]);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = {};
    Object.entries(filters).forEach(([k,v]) => { if(v && ['domain','is_licensed_engineer','is_licensed_professional','license_status','education_type','employer_name','service','name'].includes(k)) params[k]=v; });
    const r: any = await listEmployees(params);
    setEmpResult(r);
    setLoading(false);
  }, [filters]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = {};
    if (filters.domain) params.domain = filters.domain;
    if (filters.project_type) params.project_type = filters.project_type;
    if (filters.employer_name) params.employer_name = filters.employer_name;
    if (filters.service) params.service = filters.service;
    if (filters.is_waxman) params.is_waxman = filters.is_waxman;
    if (filters.name) params.name = filters.name;
    const r: any = await listProjects(params);
    setProjResult(r);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    if (!user?.is_admin) return;
    loadStats();
    if (viewMode === 'employees' || viewMode === 'profile') loadEmployees();
    else if (viewMode === 'projects') loadProjects();
  }, [user, viewMode]);

  const openProfile = async (id: number) => {
    setLoading(true);
    const e: any = await getEmployee(id);
    setSelectedEmp(e); setViewMode('profile'); setLoading(false);
  };

  const openExpiring = async () => {
    setLoading(true);
    const r: any = await getExpiringLicenses(365);
    setExpiringEmps(r.employees || []); setViewMode('expiring'); setLoading(false);
  };

  const handleToggleActive = async (id: number) => {
    await toggleActive(id); loadEmployees(); loadStats();
  };

  const handleSendAll = async () => {
    setSending(true);
    try { const r: any = await sendForms({ scope: 'all' }); setSendResult(r.message); setTimeout(()=>setSendResult(''),4000); loadStats(); loadEmployees(); }
    finally { setSending(false); }
  };

  const handleExport = () => {
    const token = localStorage.getItem('muchsharim_token');
    fetch(exportUrl(), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'muchsharim.xlsx'; a.click(); });
  };

  const setFilter = (k: string, v: string) => setFilters(f => ({...f,[k]:v}));
  const clearFilters = () => { setFilters({ domain:'', is_licensed_engineer:'', is_licensed_professional:'', license_status:'', education_type:'', employer_name:'', service:'', project_type:'', name:'', is_waxman:'' }); };
  const applyFilters = () => { viewMode === 'projects' ? loadProjects() : loadEmployees(); };

  if (authLoading) return <><Navbar /><div className="flex items-center justify-center h-64"><Loading /></div></>;

  const licenseColor = (exp?: string) => {
    if (!exp) return '';
    if (new Date(exp) < new Date()) return 'text-red-600';
    if (new Date(exp) < new Date(Date.now() + 60*24*60*60*1000)) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Stats – clickable */}
        {stats && (
          <div className="grid grid-cols-5 gap-3">
            <div className="cursor-pointer" onClick={() => { setViewMode('employees'); loadEmployees(); }}>
              <StatCard label="עובדים פעילים" value={stats.total_employees} color="text-blue-700" />
            </div>
            <div className="cursor-pointer" onClick={() => { setFilter('license_status','expiring'); setViewMode('employees'); setTimeout(loadEmployees,50); }}>
              <StatCard label="ממתינים לטופס" value={stats.pending_forms} color="text-amber-700" />
            </div>
            <div className="cursor-pointer" onClick={() => { setViewMode('projects'); loadProjects(); }}>
              <StatCard label="פרויקטים" value={stats.total_projects} color="text-purple-700" />
            </div>
            <div className={`cursor-pointer ${stats.expiring_licenses > 0 ? 'ring-2 ring-amber-300 rounded-lg' : ''}`} onClick={openExpiring}>
              <StatCard label="רישוי עומד לפוג" value={stats.expiring_licenses} color={stats.expiring_licenses > 0 ? 'text-amber-600' : 'text-green-700'} />
            </div>
            <StatCard label="לא פעילים" value={stats.inactive_employees} color="text-gray-500" />
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-2">
          <Button variant={viewMode==='employees'||viewMode==='profile'?'primary':'secondary'} size="sm" onClick={()=>{setViewMode('employees');loadEmployees();}}>
            <Users className="w-3.5 h-3.5" /> עובדים
          </Button>
          <Button variant={viewMode==='projects'?'primary':'secondary'} size="sm" onClick={()=>{setViewMode('projects');loadProjects();}}>
            <FolderOpen className="w-3.5 h-3.5" /> פרויקטים
          </Button>
          {stats?.expiring_licenses! > 0 && (
            <Button variant={viewMode==='expiring'?'primary':'secondary'} size="sm" onClick={openExpiring}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> רישויים פוגים ({stats?.expiring_licenses})
            </Button>
          )}
        </div>

        {/* Profile view */}
        {viewMode === 'profile' && selectedEmp && (
          <Card>
            <button onClick={()=>setViewMode('employees')} className="flex items-center gap-1 text-blue-600 text-sm mb-4"><ChevronLeft className="w-4 h-4" /> חזרה</button>
            <div className="flex items-center gap-3 mb-5">
              <Avatar name={`${selectedEmp.first_name} ${selectedEmp.last_name}`} size="lg" />
              <div>
                <div className="text-base font-medium">{selectedEmp.first_name} {selectedEmp.last_name}</div>
                <div className="text-sm text-gray-500">{selectedEmp.current_role}</div>
              </div>
              <div className="mr-auto flex items-center gap-2">
                {!selectedEmp.is_active && <Badge variant="red">לא פעיל</Badge>}
                <StatusPill submitted={selectedEmp.form_submitted_at} sent={selectedEmp.form_sent_at} />
                <Button variant={selectedEmp.is_active?'danger':'secondary'} size="sm" onClick={()=>handleToggleActive(selectedEmp.employee_id)}>
                  {selectedEmp.is_active ? <><ToggleRight className="w-3.5 h-3.5" /> השבת</> : <><ToggleLeft className="w-3.5 h-3.5" /> הפעל</>}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div><span className="text-gray-500">דוא"ל: </span>{selectedEmp.email}</div>
              <div><span className="text-gray-500">סוג השכלה: </span>{selectedEmp.education_type||'—'}</div>
              <div><span className="text-gray-500">מהנדס רשום: </span>{selectedEmp.is_licensed_engineer?`כן (${selectedEmp.engineer_license_no})`:'לא'}</div>
              <div>
                <span className="text-gray-500">מהנדס רשוי: </span>
                {selectedEmp.is_licensed_professional ? (
                  <span className={licenseColor(selectedEmp.license_expiry_date)}>כן – תוקף {selectedEmp.license_expiry_date}</span>
                ) : 'לא'}
              </div>
            </div>
            {selectedEmp.degrees?.length ? (
              <div className="mb-4"><div className="text-xs font-medium text-gray-500 mb-2">תארים</div>
                <div className="flex flex-wrap gap-2">{selectedEmp.degrees.map((d,i)=><Badge key={i} variant="blue">{d.degree_type} {d.field_of_study} ({d.study_start_year||'?'}–{d.graduation_year})</Badge>)}</div>
              </div>
            ) : null}
            <div className="text-xs font-medium text-gray-500 mb-2">פרויקטים ({selectedEmp.projects?.length||0})</div>
            <div className="space-y-2">
              {!(selectedEmp.projects?.length) ? <Empty text="אין פרויקטים" /> :
                selectedEmp.projects!.map(p=>(
                  <div key={p.project_id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{p.project_name}</span>
                      <DomainBadge domain={p.domain} />
                      {p.project_type && <Badge variant="gray">{p.project_type}</Badge>}
                      {p.is_waxman_project ? <Badge variant="blue">וקסמן</Badge> : <Badge variant="gray">חיצוני</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                      <span>מעסיק: <span className="text-gray-800">{p.employer_name||'—'}</span></span>
                      <span>מזמין: <span className="text-gray-800">{p.client_name}</span></span>
                      <span>היקף: <span className="text-gray-800">{p.financial_scope_range||'לא ידוע'}</span></span>
                      <span>שירותים: <span className="text-gray-800">{(p.employee_services||[]).join(', ')}</span></span>
                    </div>
                  </div>
                ))
              }
            </div>
          </Card>
        )}

        {/* Expiring licenses view */}
        {viewMode === 'expiring' && (
          <Card>
            <button onClick={()=>setViewMode('employees')} className="flex items-center gap-1 text-blue-600 text-sm mb-4"><ChevronLeft className="w-4 h-4" /> חזרה</button>
            <CardTitle>מהנדסים רשויים – רישוי עומד לפוג / פג (365 יום)</CardTitle>
            {loading ? <Loading /> : expiringEmps.length === 0 ? <Empty text="אין רישויים שפגו" /> :
              <div className="space-y-2">
                {expiringEmps.map(e=>(
                  <div key={e.employee_id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                    <Avatar name={`${e.first_name} ${e.last_name}`} size="sm" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{e.first_name} {e.last_name}</div>
                      <div className="text-xs text-gray-500">רישיון {e.engineer_license_no}</div>
                    </div>
                    <span className={`text-sm font-medium ${licenseColor(e.license_expiry_date)}`}>
                      {new Date(e.license_expiry_date) < new Date() ? '⚠️ פג!' : `תוקף: ${e.license_expiry_date}`}
                    </span>
                    <button onClick={()=>openProfile(e.employee_id)} className="text-blue-600 text-xs underline">פרופיל</button>
                  </div>
                ))}
              </div>
            }
          </Card>
        )}

        {/* Employees / Projects list view */}
        {(viewMode === 'employees' || viewMode === 'projects') && (
          <>
            <Card>
              <CardTitle>סינון</CardTitle>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="תחום"><Select value={filters.domain} onChange={e=>setFilter('domain',e.target.value)}><option value="">הכל</option><option>בינוי</option><option>תשתיות</option><option>תב"ע</option></Select></Field>
                {viewMode === 'employees' && <>
                  <Field label="מהנדס רשוי"><Select value={filters.is_licensed_professional} onChange={e=>setFilter('is_licensed_professional',e.target.value)}><option value="">הכל</option><option value="true">כן</option><option value="false">לא</option></Select></Field>
                  <Field label="סטטוס רישוי"><Select value={filters.license_status} onChange={e=>setFilter('license_status',e.target.value)}><option value="">הכל</option><option value="expired">פג</option><option value="expiring">עומד לפוג</option></Select></Field>
                  <Field label="סוג השכלה"><Select value={filters.education_type} onChange={e=>setFilter('education_type',e.target.value)}><option value="">הכל</option><option>מהנדס</option><option>הנדסאי</option><option>אדריכל</option></Select></Field>
                  <Field label="תפקיד בפרויקט"><Select value={filters.service} onChange={e=>setFilter('service',e.target.value)}><option value="">הכל</option><option>ניהול תכנון</option><option>ניהול ביצוע</option><option>פיקוח</option></Select></Field>
                </>}
                {viewMode === 'projects' && <>
                  <Field label="מקור"><Select value={filters.is_waxman} onChange={e=>setFilter('is_waxman',e.target.value)}><option value="">הכל</option><option value="true">וקסמן</option><option value="false">חיצוני</option></Select></Field>
                  <Field label="שם מעסיק"><Input value={filters.employer_name} onChange={e=>setFilter('employer_name',e.target.value)} placeholder="חפש חברה..." /></Field>
                </>}
                <Field label="חיפוש שם">
                  <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input value={filters.name} onChange={e=>setFilter('name',e.target.value)} className="pr-9" placeholder="הקלד שם..." /></div>
                </Field>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="primary" size="sm" onClick={applyFilters}>חפש</Button>
                <Button variant="secondary" size="sm" onClick={()=>{clearFilters();setTimeout(applyFilters,50);}}>נקה</Button>
                <div className="mr-auto flex gap-2">
                  {sendResult && <span className="text-sm text-green-600">{sendResult}</span>}
                  <Button variant="secondary" size="sm" onClick={handleSendAll} loading={sending}><Send className="w-3.5 h-3.5" /> שלח טפסים</Button>
                  <Button variant="secondary" size="sm" onClick={handleExport}><Download className="w-3.5 h-3.5" /> Excel</Button>
                </div>
              </div>
            </Card>

            {/* Employees table */}
            {viewMode === 'employees' && (
              <div>
                {empResult && <div className="text-sm text-gray-500 mb-2">{empResult.total} עובדים</div>}
                {loading ? <Loading /> : !empResult?.employees.length ? <Empty text="לא נמצאו עובדים" /> : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm" style={{tableLayout:'fixed'}}>
                      <thead><tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-52">עובד</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-24">השכלה</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-36">תחומים</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-28">רישוי</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-20">סטטוס</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-24"></th>
                      </tr></thead>
                      <tbody>
                        {empResult.employees.map(e=>(
                          <tr key={e.employee_id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!e.is_active?'opacity-50':''}`}>
                            <td className="px-4 py-3"><div className="flex items-center gap-2">
                              <Avatar name={`${e.first_name} ${e.last_name}`} size="sm" />
                              <div><div className="font-medium text-sm">{e.first_name} {e.last_name}</div>
                              <div className="text-xs text-gray-500">{e.current_role}</div></div>
                            </div></td>
                            <td className="px-4 py-3"><Badge variant="gray">{e.education_type||'מהנדס'}</Badge></td>
                            <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(e.domains||'').split(',').filter(Boolean).map(d=><DomainBadge key={d} domain={d.trim()} />)}</div></td>
                            <td className="px-4 py-3 text-xs">
                              {e.is_licensed_professional ? <span className={licenseColor(e.license_expiry_date)}>{e.license_expiry_date||'—'}</span> : <span className="text-gray-400">לא רשוי</span>}
                            </td>
                            <td className="px-4 py-3"><StatusPill submitted={e.form_submitted_at} sent={e.form_sent_at} /></td>
                            <td className="px-4 py-3 flex gap-2 items-center">
                              <button onClick={()=>openProfile(e.employee_id)} className="text-blue-600 text-xs underline">פרופיל</button>
                              <button onClick={()=>handleToggleActive(e.employee_id)} title={e.is_active?'השבת':'הפעל'} className="text-gray-400 hover:text-gray-600">
                                {e.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Projects table */}
            {viewMode === 'projects' && (
              <div>
                {projResult && <div className="text-sm text-gray-500 mb-2">{projResult.total} פרויקטים</div>}
                {loading ? <Loading /> : !projResult?.projects.length ? <Empty text="לא נמצאו פרויקטים" /> : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm" style={{tableLayout:'fixed'}}>
                      <thead><tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-48">פרויקט</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-28">תחום</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-32">מעסיק</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-28">היקף</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-36">עובד</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-24">תקופה</th>
                      </tr></thead>
                      <tbody>
                        {projResult.projects.map(p=>(
                          <tr key={p.project_id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-sm truncate">{p.project_name}</div>
                              {p.project_type && <div className="text-xs text-gray-400">{p.project_type}</div>}
                            </td>
                            <td className="px-4 py-3"><div className="flex flex-col gap-1"><DomainBadge domain={p.domain} />{p.is_waxman_project?<Badge variant="blue">וקסמן</Badge>:<Badge variant="gray">חיצוני</Badge>}</div></td>
                            <td className="px-4 py-3 text-xs text-gray-600 truncate">{p.employer_name||'—'}</td>
                            <td className="px-4 py-3 text-xs">{p.financial_scope_range||'—'}</td>
                            <td className="px-4 py-3">
                              <button onClick={()=>openProfile((p as any).employee_id)} className="text-blue-600 text-xs underline">{(p as any).emp_name}</button>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{p.employee_service_start}–{p.employee_service_end||'טרם'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
