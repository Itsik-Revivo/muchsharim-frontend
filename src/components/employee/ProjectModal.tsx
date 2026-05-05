'use client';
import { useState } from 'react';
import { createProject, updateProject } from '@/lib/api';
import { Button, Field, Input, Select, Textarea, Alert, DomainBadge } from '@/components/ui';
import WaxmanPicker from './WaxmanPicker';
import type { Project, WaxmanProject } from '@/types';
import { SERVICES, BINUI_ATTRS, TASHTIOTH_ATTRS } from '@/types';
import { X, Plus, Minus } from 'lucide-react';

interface Props {
  project?: Project;
  onClose: () => void;
  onSaved: () => void;
}

const empty: Partial<Project> = {
  project_name: '', domain: undefined, client_name: '', client_type: undefined,
  financial_scope: undefined, employee_service_start: '', employee_services: [],
  description: '', project_attributes: [],
};

export default function ProjectModal({ project, onClose, onSaved }: Props) {
  const [source, setSource] = useState<'waxman' | 'external'>(project?.waxman_project_id ? 'waxman' : 'external');
  const [selectedWax, setSelectedWax] = useState<WaxmanProject | null>(null);
  const [form, setForm] = useState<Partial<Project>>(project || empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof Project, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const handleWaxSelect = (p: WaxmanProject) => {
    setSelectedWax(p);
    setForm(f => ({
      ...f,
      project_name: p.project_name,
      client_name: p.client_name,
      client_type: p.client_type,
      financial_scope: p.financial_scope,
      domain: p.domain,
      waxman_project_id: p.id,
      waxman_services: p.waxman_services || [],
      waxman_service_start: p.waxman_service_start || '',
      waxman_service_end: p.waxman_service_end || '',
      floors_above: p.floors_above,
      floors_below: p.floors_below,
      area_sqm: p.area_sqm,
      project_attributes: p.project_attributes || [],
      description: p.description || '',
    }));
  };

  const toggleService = (svc: string) => {
    const current = form.employee_services || [];
    set('employee_services', current.includes(svc) ? current.filter(s => s !== svc) : [...current, svc]);
  };

  const toggleAttr = (attr: string) => {
    const current = form.project_attributes || [];
    set('project_attributes', current.includes(attr) ? current.filter(a => a !== attr) : [...current, attr]);
  };

  const handleSave = async () => {
    if (!form.project_name || !form.domain || !form.client_name || !form.client_type ||
        !form.financial_scope || !form.employee_service_start || !form.employee_services?.length || !form.description) {
      setError('נא למלא את כל שדות החובה');
      return;
    }
    setLoading(true); setError('');
    try {
      if (project?.project_id) await updateProject(project.project_id, form);
      else await createProject(form);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'שגיאה בשמירה');
    } finally {
      setLoading(false);
    }
  };

  const attrs = form.domain === 'בינוי' ? BINUI_ATTRS : form.domain === 'תשתיות' ? TASHTIOTH_ATTRS : [];

  return (
    <div style={{ minHeight: 500 }} className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h3 className="text-base font-medium">{project ? 'עריכת פרויקט' : 'הוספת פרויקט'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {error && <Alert type="error">{error}</Alert>}

          {/* Source selector */}
          {!project && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">מקור הפרויקט</div>
              <div className="flex gap-2">
                {(['waxman', 'external'] as const).map(s => (
                  <button key={s} onClick={() => setSource(s)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${source === s ? 'border-[#1B3A6B] bg-blue-50 text-[#1B3A6B] font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {s === 'waxman' ? 'פרויקט וקסמן קיים' : 'פרויקט חיצוני'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Waxman picker */}
          {source === 'waxman' && !project && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-500 mb-3">בחר פרויקט מרשימת וקסמן</div>
              <WaxmanPicker onSelect={handleWaxSelect} selectedId={selectedWax?.id} />
              {selectedWax && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800">
                  <div className="font-medium mb-1">פרטים נשלפו מה-DB ←</div>
                  <div className="grid grid-cols-2 gap-1">
                    <span>מזמין: {selectedWax.client_name}</span>
                    <span>היקף: ₪{Math.round(selectedWax.financial_scope / 1_000_000)}M</span>
                    {selectedWax.area_sqm && <span>שטח: {selectedWax.area_sqm.toLocaleString()} מ"ר</span>}
                    <span>תאריכים: {selectedWax.waxman_service_start}–{selectedWax.waxman_service_end || 'טרם'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="שם הפרויקט" required className="col-span-2">
              <Input value={form.project_name || ''} onChange={e => set('project_name', e.target.value)}
                readOnly={source === 'waxman' && !!selectedWax} className={source === 'waxman' && selectedWax ? 'bg-gray-50' : ''} />
            </Field>
            <Field label="תחום הפרויקט" required>
              <Select value={form.domain || ''} onChange={e => set('domain', e.target.value)} disabled={source === 'waxman' && !!selectedWax}>
                <option value="">בחר...</option>
                <option>בינוי</option><option>תשתיות</option><option>תב"ע</option>
              </Select>
            </Field>
            <Field label="שם המזמין" required>
              <Input value={form.client_name || ''} onChange={e => set('client_name', e.target.value)}
                readOnly={source === 'waxman' && !!selectedWax} className={source === 'waxman' && selectedWax ? 'bg-gray-50' : ''} />
            </Field>
            <Field label="גוף מזמין" required>
              <Select value={form.client_type || ''} onChange={e => set('client_type', e.target.value as any)}>
                <option value="">בחר...</option><option>ציבורי</option><option>יזם</option>
              </Select>
            </Field>
            <Field label="היקף כספי (₪)" required>
              <Input type="number" value={form.financial_scope || ''} onChange={e => set('financial_scope', parseInt(e.target.value))}
                readOnly={source === 'waxman' && !!selectedWax} className={source === 'waxman' && selectedWax ? 'bg-gray-50' : ''} />
            </Field>
          </div>

          {/* Domain-specific fields */}
          {form.domain === 'בינוי' && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl">
              <Field label="קומות עיליות"><Input type="number" value={form.floors_above || ''} onChange={e => set('floors_above', parseInt(e.target.value))} /></Field>
              <Field label='קומות תת"ק'><Input type="number" value={form.floors_below || ''} onChange={e => set('floors_below', parseInt(e.target.value))} /></Field>
              <Field label='שטח מ"ר'><Input type="number" value={form.area_sqm || ''} onChange={e => set('area_sqm', parseInt(e.target.value))} /></Field>
              <Field label='כולל תב"ע'>
                <Select value={form.includes_tba ? 'yes' : 'no'} onChange={e => set('includes_tba', e.target.value === 'yes')}>
                  <option value="no">לא</option><option value="yes">כן</option>
                </Select>
              </Field>
              <Field label="מועד טופס 4"><Input type="month" value={form.form4_date || ''} onChange={e => set('form4_date', e.target.value)} /></Field>
              <Field label="תעודת גמר"><Input type="month" value={form.completion_cert_date || ''} onChange={e => set('completion_cert_date', e.target.value)} /></Field>
            </div>
          )}
          {form.domain === 'תשתיות' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-xl">
              <Field label='שטח / אורך מ"ר'><Input type="number" value={form.area_sqm || ''} onChange={e => set('area_sqm', parseInt(e.target.value))} /></Field>
              <Field label="פתיחה לתנועה"><Input type="month" value={form.road_opening_date || ''} onChange={e => set('road_opening_date', e.target.value)} /></Field>
            </div>
          )}

          {/* Attributes */}
          {attrs.length > 0 && (
            <Field label="מאפייני הפרויקט">
              <div className="flex flex-wrap gap-2 mt-1">
                {attrs.map(a => (
                  <button key={a} type="button" onClick={() => toggleAttr(a)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      form.project_attributes?.includes(a) ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                    {a}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Services */}
          <Field label="השירותים שהענקת בפרויקט" required>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {SERVICES.map(svc => (
                <label key={svc} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.employee_services?.includes(svc) || false}
                    onChange={() => toggleService(svc)} className="rounded" />
                  {svc}
                </label>
              ))}
            </div>
          </Field>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="תחילת שירות שלך" required>
              <Input type="month" value={form.employee_service_start || ''} onChange={e => set('employee_service_start', e.target.value)} />
            </Field>
            <Field label="סיום שירות שלך">
              <Input type="month" value={form.employee_service_end || ''} onChange={e => set('employee_service_end', e.target.value)} />
            </Field>
            {(form.domain === 'בינוי' || form.domain === 'תשתיות') && <>
              <Field label="תחילת תכנון"><Input type="month" value={form.planning_start || ''} onChange={e => set('planning_start', e.target.value)} /></Field>
              <Field label="סיום תכנון"><Input type="month" value={form.planning_end || ''} onChange={e => set('planning_end', e.target.value)} /></Field>
              <Field label="תחילת ביצוע"><Input type="month" value={form.execution_start || ''} onChange={e => set('execution_start', e.target.value)} /></Field>
              <Field label="סיום ביצוע"><Input type="month" value={form.execution_end || ''} onChange={e => set('execution_end', e.target.value)} /></Field>
            </>}
          </div>

          {/* Description */}
          <Field label="תיאור הפרויקט" required>
            <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
              placeholder="תאר את הפרויקט: שטח, מספר יחידות, מאפיינים מיוחדים..." rows={3} />
          </Field>

          {/* Referee */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-500 mb-3">פרטי ממליץ מהמזמין (לא חובה)</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="שם"><Input value={form.referee_name || ''} onChange={e => set('referee_name', e.target.value)} /></Field>
              <Field label="תפקיד"><Input value={form.referee_role || ''} onChange={e => set('referee_role', e.target.value)} /></Field>
              <Field label="טלפון"><Input type="tel" value={form.referee_phone || ''} onChange={e => set('referee_phone', e.target.value)} /></Field>
              <Field label='דוא"ל'><Input type="email" value={form.referee_email || ''} onChange={e => set('referee_email', e.target.value)} /></Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          <Button variant="primary" onClick={handleSave} loading={loading}>שמור פרויקט</Button>
          <Button variant="secondary" onClick={onClose}>ביטול</Button>
        </div>
      </div>
    </div>
  );
}
