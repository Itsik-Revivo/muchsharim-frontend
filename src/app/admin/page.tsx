'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getStats, listEmployees, getEmployee, sendForms, exportUrl } from '@/lib/api';
import Navbar from '@/components/ui/Navbar';
import { Card, CardTitle, StatCard, Button, Field, Input, Select, Alert, Loading, Empty, DomainBadge, StatusPill, Avatar, Badge } from '@/components/ui';
import type { Stats, Employee, EmployeeListResponse } from '@/types';
import { Search, Download, Send, X, ChevronLeft } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [result, setResult] = useState<EmployeeListResponse | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [filters, setFilters] = useState({ domain:'', is_licensed_engineer:'', name:'', degree_type:'', service:'' });

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (!authLoading && user && !user.is_admin) router.replace('/employee');
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    const params: Record<string,string> = {};
    Object.entries(filters).forEach(([k,v]) => { if(v) params[k] = v; });
    const [s, r]: any = await Promise.all([getStats(), listEmployees(params)]);
    setStats(s); setResult(r);
    setLoading(false);
  }, [user, filters]);

  useEffect(() => { load(); }, [load]);

  const openProfile = async (id: number) => {
    setProfileLoading(true);
    try { const e: any = await getEmployee(id); setSelectedEmp(e); }
    finally { setProfileLoading(false); }
  };

  const handleSendAll = async () => {
    setSending(true);
    try {
      const r: any = await sendForms({ scope: 'all' });
      setSendResult(r.message || `נשלחו ${r.sent} טפסים`);
      setTimeout(() => setSendResult(''), 4000);
      load();
    } finally { setSending(false); }
  };

  const handleExport = () => {
    const token = localStorage.getItem('muchsharim_token');
    const url = exportUrl();
    const a = document.createElement('a');
    a.href = url + (token ? `?token=${token}` : '');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        a.href = URL.createObjectURL(blob);
        a.download = `muchsharim_export.xlsx`;
        a.click();
      });
  };

  const setFilter = (k: string, v: string) => setFilters(f => ({...f,[k]:v}));
  const clearFilters = () => setFilters({ domain:'', is_licensed_engineer:'', name:'', degree_type:'', service:'' });

  if (authLoading) return <><Navbar /><div className="flex items-center justify-center h-64"><Loading /></div></>;

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="עובדים במאגר"   value={stats.total_employees}    color="text-blue-700" />
            <StatCard label="מילאו טופס"      value={stats.filled_forms}       color="text-green-700" />
            <StatCard label="ממתינים"          value={stats.pending_forms}      color="text-amber-700" />
            <StatCard label="פרויקטים"         value={stats.total_projects}     color="text-purple-700" />
          </div>
        )}

        {/* Employee profile panel */}
        {selectedEmp ? (
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={()=>setSelectedEmp(null)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <ChevronLeft className="w-4 h-4" /> חזרה לרשימה
              </button>
            </div>
            {profileLoading ? <Loading /> : (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <Avatar name={`${selectedEmp.first_name} ${selectedEmp.last_name}`} size="lg" />
                  <div>
                    <div className="text-base font-medium">{selectedEmp.first_name} {selectedEmp.last_name}</div>
                    <div className="text-sm text-gray-500">{selectedEmp.current_role} · {selectedEmp.department}</div>
                  </div>
                  {selectedEmp.is_admin ? <span className="mr-auto text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">Admin</span> : <div className="mr-auto" />}
                  <StatusPill submitted={selectedEmp.form_submitted_at} sent={selectedEmp.form_sent_at} />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-5">
                  <div><span className="text-gray-500">דוא"ל: </span>{selectedEmp.email}</div>
                  <div><span className="text-gray-500">טלפון: </span>{selectedEmp.phone}</div>
                  <div><span className="text-gray-500">מהנדס רשום: </span>
                    {selectedEmp.is_licensed_engineer ? `כן (${selectedEmp.engineer_license_no})` : 'לא'}
                  </div>
                </div>
                {selectedEmp.degrees?.length ? (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">תארים</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmp.degrees.map((d,i) => (
                        <Badge key={i} variant="blue">{d.degree_type} {d.field_of_study} – {d.institution}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="text-xs font-medium text-gray-500 mb-2">פרויקטים ({selectedEmp.projects?.length || 0})</div>
                <div className="space-y-2">
                  {(selectedEmp.projects||[]).length === 0 ? <Empty text="אין פרויקטים" /> :
                  selectedEmp.projects!.map(p => (
                    <div key={p.project_id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{p.project_name}</span>
                        <DomainBadge domain={p.domain} />
                        {p.waxman_project_id && <Badge variant="gray">וקסמן</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                        <span>מזמין: <span className="text-gray-800">{p.client_name} ({p.client_type})</span></span>
                        <span>היקף: <span className="text-gray-800">₪{Math.round(p.financial_scope/1_000_000)}M</span></span>
                        <span>שירותים: <span className="text-gray-800">{(p.employee_services||[]).join(', ')}</span></span>
                        <span>תקופה: <span className="text-gray-800">{p.employee_service_start} – {p.employee_service_end||'טרם'}</span></span>
                        {p.description && <span className="col-span-2 text-gray-600 mt-1">{p.description.slice(0,120)}{p.description.length>120?'...':''}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <>
            {/* Filters */}
            <Card>
              <CardTitle>סינון לפי דרישות מכרז</CardTitle>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="תחום פרויקט">
                  <Select value={filters.domain} onChange={e=>setFilter('domain',e.target.value)}>
                    <option value="">הכל</option><option>בינוי</option><option>תשתיות</option><option>תב"ע</option>
                  </Select>
                </Field>
                <Field label="מהנדס רשום">
                  <Select value={filters.is_licensed_engineer} onChange={e=>setFilter('is_licensed_engineer',e.target.value)}>
                    <option value="">הכל</option><option value="true">כן</option><option value="false">לא</option>
                  </Select>
                </Field>
                <Field label="סוג תואר">
                  <Select value={filters.degree_type} onChange={e=>setFilter('degree_type',e.target.value)}>
                    <option value="">הכל</option><option>B.Sc</option><option>M.Sc</option><option>MBA</option><option>Ph.D</option>
                  </Select>
                </Field>
                <Field label="תפקיד בפרויקט">
                  <Select value={filters.service} onChange={e=>setFilter('service',e.target.value)}>
                    <option value="">הכל</option><option>ניהול תכנון</option><option>ניהול ביצוע</option><option>פיקוח</option>
                  </Select>
                </Field>
                <Field label="חיפוש שם">
                  <div className="relative">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input value={filters.name} onChange={e=>setFilter('name',e.target.value)} className="pr-9" placeholder="הקלד שם..." />
                  </div>
                </Field>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={load}>חפש</Button>
                <Button variant="secondary" size="sm" onClick={clearFilters}>נקה</Button>
                <div className="mr-auto flex gap-2">
                  {sendResult && <span className="text-sm text-green-600 flex items-center">{sendResult}</span>}
                  <Button variant="secondary" size="sm" onClick={handleSendAll} loading={sending}>
                    <Send className="w-3.5 h-3.5" /> שלח טפסים לכולם
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleExport}>
                    <Download className="w-3.5 h-3.5" /> ייצוא Excel
                  </Button>
                </div>
              </div>
            </Card>

            {/* Results */}
            <div>
              {result && <div className="text-sm text-gray-500 mb-2">{result.total} עובדים נמצאו</div>}
              {loading ? <Loading /> : !result?.employees.length ? <Empty text="לא נמצאו עובדים" /> : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm" style={{tableLayout:'fixed'}}>
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-56">עובד</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-24">מהנדס</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-36">תחומים</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-20">פרויקטים</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-24">סטטוס</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.employees.map(e => (
                        <tr key={e.employee_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={`${e.first_name} ${e.last_name}`} size="sm" />
                              <div>
                                <div className="font-medium text-sm">{e.first_name} {e.last_name}</div>
                                <div className="text-xs text-gray-500">{e.current_role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {e.is_licensed_engineer ? <Badge variant="blue">כן</Badge> : <Badge variant="gray">לא</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(e.domains||'').split(',').filter(Boolean).map(d=><DomainBadge key={d} domain={d.trim()} />)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{e.project_count}</td>
                          <td className="px-4 py-3">
                            <StatusPill submitted={e.form_submitted_at} sent={e.form_sent_at} />
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={()=>openProfile(e.employee_id)} className="text-blue-600 hover:text-blue-800 text-xs underline">פרופיל</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
