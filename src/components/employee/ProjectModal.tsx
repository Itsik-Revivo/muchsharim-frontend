'use client';
import { useState } from 'react';
import { createProject, updateProject } from '@/lib/api';
import { Button, Field, Input, Select, Textarea, Alert, DomainBadge, Badge } from '@/components/ui';
import type { Project } from '@/types';
import { SERVICES, BINUI_TYPES, TASHTIOTH_TYPES, BINUI_ATTRS, TASHTIOTH_ATTRS, FINANCIAL_RANGES } from '@/types';
import { X, Building2 } from 'lucide-react';

interface Props { project?: Project; onClose: () => void; onSaved: () => void; }

const empty: Partial<Project> = {
  project_name:'', domain:undefined, project_type:'',
  is_waxman_project:false, employer_name:'',
  client_name:'', client_type:undefined,
  financial_scope_known:false, financial_scope_range:'',
  employee_service_start:'', employee_services:[],
  description:'', project_attributes:[],
  referee_name:'', referee_role:'', referee_phone:'', referee_email:'',
};

export default function ProjectModal({ project, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Project>>(project || empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof Project, value: unknown) => setForm(f => ({ ...f, [key]: value }));
  const toggleService = (svc: string) => {
    const cur = form.employee_services || [];
    set('employee_services', cur.includes(svc) ? cur.filter(s => s !== svc) : [...cur, svc]);
  };
  const toggleAttr = (attr: string) => {
    const cur = form.project_attributes || [];
    set('project_attributes', cur.includes(attr) ? cur.filter(a => a !== attr) : [...cur, attr]);
  };

  const handleSave = async () => {
    if (!form.project_name || !form.domain || !form.client_name || !form.client_type ||
        !form.employee_service_start || !form.employee_services?.length || !form.description ||
        !form.referee_name || !form.referee_role || !form.referee_phone || !form.referee_email) {
      setError('נא למלא את כל שדות החובה, כולל פרטי ממליץ'); return;
    }
    setLoading(true); setError('');
    try {
      if (project?.project_id) await updateProject(project.project_id, form);
      else await createProject(form);
      onSaved(); onClose();
    } catch (e: any) { setError(e.message || 'שגיאה בשמירה'); }
    finally { setLoading(false); }
  };

  const projectTypes = form.domain === 'בינוי' ? BINUI_TYPES : form.domain === 'תשתיות' ? TASHTIOTH_TYPES : [];
  const attrs = form.domain === 'בינוי' ? BINUI_ATTRS : form.domain === 'תשתיות' ? TASHTIOTH_ATTRS : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-6 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-6">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-base font-medium">{project ? 'עריכת פרויקט' : 'הוספת פרויקט'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {error && <Alert type="error">{error}</Alert>}

          {/* Waxman toggle */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-2">מקור הפרויקט</div>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={!!form.is_waxman_project} onChange={()=>set('is_waxman_project',true)} />
                <Badge variant="blue">בוצע במסגרת Waxman</Badge>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={!form.is_waxman_project} onChange={()=>set('is_waxman_project',false)} />
                <Badge variant="gray">פרויקט חיצוני</Badge>
              </label>
            </div>
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="שם הפרויקט" required className="col-span-2">
              <Input value={form.project_name||''} onChange={e=>set('project_name',e.target.value)} />
            </Field>
            <Field label="תחום הפרויקט" required>
              <Select value={form.domain||''} onChange={e=>{set('domain',e.target.value as any);set('project_type','');}}>
                <option value="">בחר...</option><option>בינוי</option><option>תשתיות</option><option>תב"ע</option>
              </Select>
            </Field>
            {projectTypes.length > 0 && (
              <Field label="סוג הפרויקט" required>
                <Select value={form.project_type||''} onChange={e=>set('project_type',e.target.value)}>
                  <option value="">בחר...</option>
                  {projectTypes.map(t=><option key={t}>{t}</option>)}
                </Select>
              </Field>
            )}
            <Field label="שם החברה / מעסיק" required>
              <div className="relative">
                <Building2 className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input value={form.employer_name||''} onChange={e=>set('employer_name',e.target.value)} className="pr-9"
                  placeholder={form.is_waxman_project ? 'וקסמן גרופ' : 'שם חברה...'} />
              </div>
            </Field>
            <Field label="שם המזמין" required>
              <Input value={form.client_name||''} onChange={e=>set('client_name',e.target.value)} />
            </Field>
            <Field label="גוף מזמין" required>
              <Select value={form.client_type||''} onChange={e=>set('client_type',e.target.value as any)}>
                <option value="">בחר...</option><option>ציבורי</option><option>יזם</option>
              </Select>
            </Field>
          </div>

          {/* Financial scope v1.2 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs font-medium text-gray-600 mb-3">היקף כספי</div>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={!!form.financial_scope_known} onChange={()=>set('financial_scope_known',true)} /> ידוע לי ההיקף
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={!form.financial_scope_known} onChange={()=>set('financial_scope_known',false)} /> לא ידוע / לא רלוונטי
              </label>
            </div>
            {form.financial_scope_known && (
              <Field label="טווח היקף כספי" required>
                <Select value={form.financial_scope_range||''} onChange={e=>set('financial_scope_range',e.target.value)}>
                  <option value="">בחר טווח...</option>
                  {FINANCIAL_RANGES.map(r=><option key={r}>{r}</option>)}
                </Select>
              </Field>
            )}
          </div>

          {/* Domain-specific */}
          {form.domain === 'בינוי' && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl">
              <Field label="קומות עיליות"><Input type="number" value={form.floors_above||''} onChange={e=>set('floors_above',parseInt(e.target.value))} /></Field>
              <Field label='קומות תת"ק'><Input type="number" value={form.floors_below||''} onChange={e=>set('floors_below',parseInt(e.target.value))} /></Field>
              <Field label='שטח מ"ר'><Input type="number" value={form.area_sqm||''} onChange={e=>set('area_sqm',parseInt(e.target.value))} /></Field>
              <Field label='כולל טאבו'><Select value={form.includes_tba?'yes':'no'} onChange={e=>set('includes_tba',e.target.value==='yes')}><option value="no">לא</option><option value="yes">כן</option></Select></Field>
              <Field label="מועד טופס 4"><Input type="month" value={form.form4_date||''} onChange={e=>set('form4_date',e.target.value)} /></Field>
              <Field label="תעודת גמר"><Input type="month" value={form.completion_cert_date||''} onChange={e=>set('completion_cert_date',e.target.value)} /></Field>
            </div>
          )}
          {form.domain === 'תשתיות' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-xl">
              <Field label='שטח / אורך מ"ר'><Input type="number" value={form.area_sqm||''} onChange={e=>set('area_sqm',parseInt(e.target.value))} /></Field>
              <Field label="פתיחה לתנועה"><Input type="month" value={form.road_opening_date||''} onChange={e=>set('road_opening_date',e.target.value)} /></Field>
            </div>
          )}

          {/* Attributes */}
          {attrs.length > 0 && (
            <Field label="מאפייני פרויקט">
              <div className="flex flex-wrap gap-2 mt-1">
                {attrs.map(a=>(
                  <button key={a} type="button" onClick={()=>toggleAttr(a)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${form.project_attributes?.includes(a)?'bg-[#1B3A6B] text-white border-[#1B3A6B]':'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Services */}
          <Field label="השירותים שהענקת" required>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {SERVICES.map(svc=>(
                <label key={svc} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.employee_services?.includes(svc)||false} onChange={()=>toggleService(svc)} className="rounded" />
                  {svc}
                </label>
              ))}
            </div>
          </Field>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="תחילת שירות שלך" required><Input type="month" value={form.employee_service_start||''} onChange={e=>set('employee_service_start',e.target.value)} /></Field>
            <Field label="סיום שירות שלך"><Input type="month" value={form.employee_service_end||''} onChange={e=>set('employee_service_end',e.target.value)} /></Field>
            {(form.domain==='בינוי'||form.domain==='תשתיות') && <>
              <Field label="תחילת תכנון"><Input type="month" value={form.planning_start||''} onChange={e=>set('planning_start',e.target.value)} /></Field>
              <Field label="סיום תכנון"><Input type="month" value={form.planning_end||''} onChange={e=>set('planning_end',e.target.value)} /></Field>
              <Field label="תחילת ביצוע"><Input type="month" value={form.execution_start||''} onChange={e=>set('execution_start',e.target.value)} /></Field>
              <Field label="סיום ביצוע"><Input type="month" value={form.execution_end||''} onChange={e=>set('execution_end',e.target.value)} /></Field>
            </>}
          </div>

          {/* Description */}
          <Field label="תיאור הפרויקט" required>
            <Textarea value={form.description||''} onChange={e=>set('description',e.target.value)} rows={3} placeholder="תאר את הפרויקט..." />
          </Field>

          {/* Referee – all required in v1.2 */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-red-600 mb-3">פרטי ממליץ מהמזמין – שדות חובה</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="שם הממליץ" required><Input value={form.referee_name||''} onChange={e=>set('referee_name',e.target.value)} /></Field>
              <Field label="תפקיד" required><Input value={form.referee_role||''} onChange={e=>set('referee_role',e.target.value)} /></Field>
              <Field label="טלפון" required><Input type="tel" value={form.referee_phone||''} onChange={e=>set('referee_phone',e.target.value)} /></Field>
              <Field label='דוא"ל' required><Input type="email" value={form.referee_email||''} onChange={e=>set('referee_email',e.target.value)} /></Field>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          <Button variant="primary" onClick={handleSave} loading={loading}>שמור פרויקט</Button>
          <Button variant="secondary" onClick={onClose}>ביטול</Button>
        </div>
      </div>
    </div>
  );
}
