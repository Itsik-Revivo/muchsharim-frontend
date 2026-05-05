'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMe, updateMe, getMyProjects, deleteProject } from '@/lib/api';
import Navbar from '@/components/ui/Navbar';
import ProjectModal from '@/components/employee/ProjectModal';
import { Card, CardTitle, Button, Field, Input, Select, Alert, Loading, Empty, DomainBadge, Avatar, Badge } from '@/components/ui';
import type { Employee, Project, Degree } from '@/types';
import { DEGREE_TYPES, DEPARTMENTS } from '@/types';
import { Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

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

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [empData, projData]: any = await Promise.all([getMe(), getMyProjects()]);
      setEmp(empData);
      setProjects(projData || []);
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
        phone: emp.phone, department: emp.department, current_role: emp.current_role,
        is_licensed_engineer: emp.is_licensed_engineer,
        engineer_license_no: emp.engineer_license_no,
        engineer_license_year: emp.engineer_license_year,
        additional_certs: emp.additional_certs,
        degrees: emp.degrees || [],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('למחוק פרויקט זה?')) return;
    await deleteProject(id);
    loadData();
  };

  const addDegree = () => setEmp(e => e ? ({ ...e, degrees: [...(e.degrees||[]), { degree_type:'B.Sc', field_of_study:'', institution:'', graduation_year: 2020 }] }) : e);
  const removeDegree = (i: number) => setEmp(e => e ? ({ ...e, degrees: (e.degrees||[]).filter((_,idx)=>idx!==i) }) : e);
  const updateDegree = (i: number, key: keyof Degree, val: unknown) =>
    setEmp(e => e ? ({ ...e, degrees: (e.degrees||[]).map((d,idx) => idx===i ? {...d,[key]:val} : d) }) : e);
  const setField = (key: keyof Employee, val: unknown) => setEmp(e => e ? {...e,[key]:val} : e);

  if (authLoading || loading) return <><Navbar /><div className="flex items-center justify-center h-64"><Loading /></div></>;

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar name={`${emp?.first_name} ${emp?.last_name}`} size="lg" />
          <div>
            <h1 className="text-lg font-medium">{emp?.first_name} {emp?.last_name}</h1>
            <div className="text-sm text-gray-500">{emp?.current_role} · {emp?.department}</div>
          </div>
          {saved && <div className="mr-auto flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" /> נשמר</div>}
        </div>

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
              <Field label="מחלקה">
                <Select value={emp.department} onChange={e=>setField('department',e.target.value)}>
                  {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="תפקיד"><Input value={emp.current_role} onChange={e=>setField('current_role',e.target.value)} /></Field>

              <div className="col-span-2 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs font-medium text-gray-600">מהנדס רשום</span>
                  {(['yes','no'] as const).map(v=>(
                    <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" checked={v==='yes' ? !!emp.is_licensed_engineer : !emp.is_licensed_engineer}
                        onChange={()=>setField('is_licensed_engineer', v==='yes')} /> {v==='yes'?'כן':'לא'}
                    </label>
                  ))}
                </div>
                {!!emp.is_licensed_engineer && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="מספר רישיון"><Input value={emp.engineer_license_no||''} onChange={e=>setField('engineer_license_no',e.target.value)} /></Field>
                    <Field label="שנת קבלה"><Input type="number" value={emp.engineer_license_year||''} onChange={e=>setField('engineer_license_year',parseInt(e.target.value))} /></Field>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Degrees */}
        <Card>
          <CardTitle>תארים אקדמיים</CardTitle>
          <div className="space-y-3">
            {(emp?.degrees||[]).map((deg, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 grid grid-cols-4 gap-3 relative">
                <button onClick={()=>removeDegree(i)} className="absolute left-3 top-3 text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                <Field label="סוג תואר">
                  <Select value={deg.degree_type} onChange={e=>updateDegree(i,'degree_type',e.target.value as any)}>
                    {DEGREE_TYPES.map(d=><option key={d}>{d}</option>)}
                  </Select>
                </Field>
                <Field label="תחום לימוד"><Input value={deg.field_of_study} onChange={e=>updateDegree(i,'field_of_study',e.target.value)} /></Field>
                <Field label="מוסד"><Input value={deg.institution} onChange={e=>updateDegree(i,'institution',e.target.value)} /></Field>
                <Field label="שנת סיום"><Input type="number" value={deg.graduation_year} onChange={e=>updateDegree(i,'graduation_year',parseInt(e.target.value))} /></Field>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full border border-dashed border-gray-200" onClick={addDegree}>
            <Plus className="w-3.5 h-3.5" /> הוסף תואר
          </Button>
        </Card>

        {/* Projects */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">ניסיון תעסוקתי – פרויקטים ({projects.length})</span>
            <Button variant="primary" size="sm" onClick={()=>{setEditProject(undefined);setShowModal(true);}}>
              <Plus className="w-3.5 h-3.5" /> הוסף פרויקט
            </Button>
          </div>
          {projects.length === 0
            ? <Empty text="טרם הוזנו פרויקטים. לחץ + להוסיף." />
            : <div className="space-y-3">
                {projects.map(p => (
                  <div key={p.project_id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{p.project_name}</span>
                      <DomainBadge domain={p.domain} />
                      {p.waxman_project_id && <Badge variant="gray">וקסמן</Badge>}
                      <div className="mr-auto flex gap-1">
                        <button onClick={()=>{setEditProject(p);setShowModal(true);}} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={()=>handleDelete(p.project_id!)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <span>מזמין: <span className="text-gray-800">{p.client_name}</span></span>
                      <span>היקף: <span className="text-gray-800">₪{Math.round(p.financial_scope/1_000_000)}M</span></span>
                      <span>שירותים: <span className="text-gray-800">{p.employee_services?.join(', ')}</span></span>
                      {p.employee_service_start && <span className="col-span-3">תקופה: {p.employee_service_start} – {p.employee_service_end||'טרם הסתיים'}</span>}
                    </div>
                  </div>
                ))}
              </div>
          }
        </Card>

        <div className="flex gap-3 pb-6">
          <Button variant="primary" onClick={handleSave} loading={saving}>שמור ושלח</Button>
          <Button variant="secondary" onClick={()=>router.refresh()}>רענן</Button>
        </div>
      </div>

      {showModal && <ProjectModal project={editProject} onClose={()=>setShowModal(false)} onSaved={loadData} />}
    </>
  );
}
