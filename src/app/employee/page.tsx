'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMe, updateMe, getMyProjects, deleteProject } from '@/lib/api';
import Navbar from '@/components/ui/Navbar';
import ProjectModal from '@/components/employee/ProjectModal';
import { Card, CardTitle, Button, Field, Input, Select, Alert, Loading, Empty, DomainBadge, Avatar, Badge } from '@/components/ui';
import type { Employee, Project, Degree } from '@/types';
import { DEGREE_TYPES, EDUCATION_TYPES } from '@/types';
import { Plus, Trash2, Edit2, CheckCircle, Building2 } from 'lucide-react';

export default function EmployeePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | undefined>();

  useEffect(() => { if (!authLoading && !user) router.replace('/login'); }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [empData, projData]: any = await Promise.all([getMe(), getMyProjects()]);
      setEmp(empData); setProjects(projData || []);
    } catch { setError('שגיאה בטעינת נתונים'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    if (!emp) return;
    setSaving(true); setError('');
    try {
      await updateMe({
        first_name: emp.first_name, last_name: emp.last_name,
        first_name_en: emp.first_name_en, last_name_en: emp.last_name_en,
        phone: emp.phone, current_role: emp.current_role,
        education_type: emp.education_type,
        is_licensed_engineer: emp.is_licensed_engineer,
        engineer_license_no: emp.engineer_license_no,
        engineer_license_year: emp.engineer_license_year,
        is_licensed_professional: emp.is_licensed_professional,
        license_expiry_date: emp.license_expiry_date,
        additional_certs: emp.additional_certs,
        degrees: emp.degrees || [],
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('למחוק פרויקט זה?')) return;
    await deleteProject(id); loadData();
  };

  const setField = (key: keyof Employee, val: unknown) => setEmp(e => e ? { ...e, [key]: val } : e);
  const addDegree = () => setEmp(e => e ? ({ ...e, degrees: [...(e.degrees||[]), { degree_type:'B.Sc', field_of_study:'', institution:'', study_start_year: undefined, graduation_year: 2020 }] }) : e);
  const removeDegree = (i: number) => setEmp(e => e ? ({ ...e, degrees: (e.degrees||[]).filter((_,idx)=>idx!==i) }) : e);
  const updateDegree = (i: number, key: keyof Degree, val: unknown) =>
    setEmp(e => e ? ({ ...e, degrees: (e.degrees||[]).map((d,idx) => idx===i ? {...d,[key]:val} : d) }) : e);

  if (authLoading || loading) return <><Navbar /><div className="flex items-center justify-center h-64"><Loading /></div></>;

  const licenseExpiringSoon = emp?.is_licensed_professional && emp?.license_expiry_date &&
    new Date(emp.license_expiry_date) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const licenseExpired = emp?.is_licensed_professional && emp?.license_expiry_date &&
    new Date(emp.license_expiry_date) < new Date();

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={`${emp?.first_name} ${emp?.last_name}`} size="lg" />
          <div>
            <h1 className="text-lg font-medium">{emp?.first_name} {emp?.last_name}</h1>
            <div className="text-sm text-gray-500">{emp?.current_role}</div>
          </div>
          {saved && <div className="mr-auto flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" /> נשמר</div>}
        </div>

        {/* License warning */}
        {licenseExpired && <Alert type="error">⚠️ תוקף רישיון המהנדס הרשוי שלך פג ({emp?.license_expiry_date}). נא לעדכן.</Alert>}
        {!licenseExpired && licenseExpiringSoon && <Alert type="info">⏰ תוקף רישיון המהנדס הרשוי שלך עומד לפוג ב-{emp?.license_expiry_date}. מומלץ לחדש.</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        {/* Personal details */}
        <Card>
          <CardTitle>פרטים אישיים</CardTitle>
          {emp && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="שם פרטי" required><Input value={emp.first_name} onChange={e=>setField('first_name',e.target.value)} /></Field>
              <Field label="שם משפחה" required><Input value={emp.last_name} onChange={e=>setField('last_name',e.target.value)} /></Field>
              <Field label="First name (EN)"><Input value={emp.first_name_en||''} onChange={e=>setField('first_name_en',e.target.value)} dir="ltr" /></Field>
              <Field label="Last name (EN)"><Input value={emp.last_name_en||''} onChange={e=>setField('last_name_en',e.target.value)} dir="ltr" /></Field>
              <Field label='דוא"ל'><Input value={emp.email} disabled className="bg-gray-50" /></Field>
              <Field label="טלפון"><Input value={emp.phone} onChange={e=>setField('phone',e.target.value)} /></Field>
              <Field label="תפקיד" required><Input value={emp.current_role} onChange={e=>setField('current_role',e.target.value)} /></Field>
              <Field label="סוג השכלה" required>
                <Select value={emp.education_type||'מהנדס'} onChange={e=>setField('education_type',e.target.value as any)}>
                  {EDUCATION_TYPES.map(t=><option key={t}>{t}</option>)}
                </Select>
              </Field>

              {/* Licensed engineer */}
              <div className="col-span-2 border-t border-gray-100 pt-4">
                <div className="text-xs font-medium text-gray-500 mb-3">רישום ורישוי מהנדס</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">מהנדס רשום (פנקס)</div>
                    <div className="flex gap-4 mb-2">
                      {(['כן','לא'] as const).map(v=>(
                        <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="radio" checked={v==='כן'?!!emp.is_licensed_engineer:!emp.is_licensed_engineer} onChange={()=>setField('is_licensed_engineer',v==='כן')} /> {v}
                        </label>
                      ))}
                    </div>
                    {!!emp.is_licensed_engineer && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="מספר רישום"><Input value={emp.engineer_license_no||''} onChange={e=>setField('engineer_license_no',e.target.value)} /></Field>
                        <Field label="שנת תעודת רישום"><Input type="number" value={emp.engineer_license_year||''} onChange={e=>setField('engineer_license_year',parseInt(e.target.value))} /></Field>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">מהנדס רשוי (רישיון)</div>
                    <div className="flex gap-4 mb-2">
                      {(['כן','לא'] as const).map(v=>(
                        <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="radio" checked={v==='כן'?!!emp.is_licensed_professional:!emp.is_licensed_professional} onChange={()=>setField('is_licensed_professional',v==='כן')} /> {v}
                        </label>
                      ))}
                    </div>
                    {!!emp.is_licensed_professional && (
                      <Field label="תוקף רישוי">
                        <Input type="date" value={emp.license_expiry_date||''} onChange={e=>setField('license_expiry_date',e.target.value)}
                          className={licenseExpired?'border-red-400':licenseExpiringSoon?'border-amber-400':''} />
                      </Field>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Degrees */}
        <Card>
          <CardTitle>תארים אקדמיים</CardTitle>
          <div className="space-y-3">
            {(emp?.degrees||[]).map((deg, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 relative">
                <button onClick={()=>removeDegree(i)} className="absolute left-3 top-3 text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="סוג תואר"><Select value={deg.degree_type} onChange={e=>updateDegree(i,'degree_type',e.target.value as any)}>{DEGREE_TYPES.map(d=><option key={d}>{d}</option>)}</Select></Field>
                  <Field label="תחום לימוד"><Input value={deg.field_of_study} onChange={e=>updateDegree(i,'field_of_study',e.target.value)} /></Field>
                  <Field label="מוסד"><Input value={deg.institution} onChange={e=>updateDegree(i,'institution',e.target.value)} /></Field>
                  <Field label="שנת התחלה"><Input type="number" value={deg.study_start_year||''} onChange={e=>updateDegree(i,'study_start_year',parseInt(e.target.value))} placeholder="2015" /></Field>
                  <Field label="שנת סיום"><Input type="number" value={deg.graduation_year} onChange={e=>updateDegree(i,'graduation_year',parseInt(e.target.value))} /></Field>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full border border-dashed border-gray-200" onClick={addDegree}><Plus className="w-3.5 h-3.5" /> הוסף תואר</Button>
        </Card>

        {/* Projects */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">פרויקטים ({projects.length})</span>
            <Button variant="primary" size="sm" onClick={()=>{setEditProject(undefined);setShowModal(true);}}>
              <Plus className="w-3.5 h-3.5" /> הוסף פרויקט
            </Button>
          </div>
          {projects.length === 0 ? <Empty text="טרם הוזנו פרויקטים" /> :
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.project_id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{p.project_name}</span>
                    <DomainBadge domain={p.domain} />
                    {p.project_type && <Badge variant="gray">{p.project_type}</Badge>}
                    {p.is_waxman_project ? <Badge variant="blue">וקסמן</Badge> : <Badge variant="gray">חיצוני</Badge>}
                    <div className="mr-auto flex gap-1">
                      <button onClick={()=>{setEditProject(p);setShowModal(true);}} className="p-1.5 text-gray-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={()=>handleDelete(p.project_id!)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <span><Building2 className="w-3 h-3 inline ml-1" />{p.employer_name||p.client_name}</span>
                    <span>היקף: {p.financial_scope_range||'לא ידוע'}</span>
                    <span>{(p.employee_services||[]).join(', ')}</span>
                    {p.employee_service_start && <span className="col-span-3">{p.employee_service_start} – {p.employee_service_end||'טרם'}</span>}
                  </div>
                </div>
              ))}
            </div>
          }
        </Card>

        <div className="flex gap-3 pb-6">
          <Button variant="primary" onClick={handleSave} loading={saving}>שמור ושלח</Button>
          <Button variant="secondary" onClick={loadData}>רענן</Button>
        </div>
      </div>
      {showModal && <ProjectModal project={editProject} onClose={()=>setShowModal(false)} onSaved={loadData} />}
    </>
  );
}
