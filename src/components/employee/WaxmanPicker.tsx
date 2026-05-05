'use client';
import { useState, useEffect } from 'react';
import { getWaxmanProjects } from '@/lib/api';
import { Input, DomainBadge, Loading } from '@/components/ui';
import type { WaxmanProject } from '@/types';
import { Search } from 'lucide-react';

interface Props {
  onSelect: (project: WaxmanProject) => void;
  selectedId?: string;
}

export default function WaxmanPicker({ onSelect, selectedId }: Props) {
  const [projects, setProjects] = useState<WaxmanProject[]>([]);
  const [filtered, setFiltered] = useState<WaxmanProject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWaxmanProjects().then((res: any) => {
      setProjects(res.projects || []);
      setFiltered(res.projects || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(projects); return; }
    setFiltered(projects.filter(p =>
      p.project_name.includes(search) || p.client_name.includes(search) || p.domain.includes(search)
    ));
  }, [search, projects]);

  if (loading) return <Loading text="טוען פרויקטי וקסמן..." />;

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input
          placeholder="חפש פרויקט..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`w-full text-right px-3 py-2.5 rounded-lg border transition-all text-sm ${
              selectedId === p.id
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-gray-800">{p.project_name}</span>
              <DomainBadge domain={p.domain} />
            </div>
            <div className="text-xs text-gray-500">
              {p.client_name} · ₪{Math.round(p.financial_scope / 1_000_000)}M
            </div>
          </button>
        ))}
        {filtered.length === 0 && <div className="py-6 text-center text-sm text-gray-400">לא נמצאו פרויקטים</div>}
      </div>
    </div>
  );
}
