'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Bug, Leaf, RefreshCw, Search, X } from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';

interface Disease {
  id: number;
  name: string;
  icon: string | null;
  severity: string;
  symptoms: string;
  cause: string;
  treatment: string;
  prevention: string;
}

function severityClass(severity: string) {
  return (severity || '').toLowerCase().includes('cao') ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning';
}

export default function KnowledgePage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Disease | null>(null);
  const diseasesQuery = useApiData<Disease[]>('/disease-library', { pollMs: 300000 });
  const diseases = useMemo(() => diseasesQuery.data || [], [diseasesQuery.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return diseases;
    return diseases.filter((disease) =>
      disease.name.toLowerCase().includes(query) ||
      disease.symptoms.toLowerCase().includes(query)
    );
  }, [diseases, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thư viện bệnh lúa"
        description="Tra cứu triệu chứng, nguyên nhân và cách xử lý các bệnh lúa phổ biến"
        action={
          <button onClick={diseasesQuery.refetch} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50">
            <RefreshCw className={`h-4 w-4 ${diseasesQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm bệnh theo tên hoặc triệu chứng..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <DataState
        loading={diseasesQuery.loading}
        error={diseasesQuery.error}
        empty={!diseasesQuery.loading && !diseasesQuery.error && filtered.length === 0}
        emptyText="Không tìm thấy bệnh phù hợp"
        onRetry={diseasesQuery.refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((disease, index) => (
            <motion.button
              key={disease.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              onClick={() => setSelected(disease)}
              className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/50"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{disease.icon || '🌾'}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold transition group-hover:text-primary">{disease.name}</h3>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityClass(disease.severity)}`}>
                    {disease.severity}
                  </span>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{disease.symptoms}</p>
            </motion.button>
          ))}
        </div>
      </DataState>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6"
            >
              <button onClick={() => setSelected(null)} className="absolute right-4 top-4 rounded-lg p-2 transition hover:bg-accent">
                <X className="h-4 w-4" />
              </button>

              <div className="mb-6 flex items-center gap-4">
                <div className="text-5xl">{selected.icon || '🌾'}</div>
                <div>
                  <h2 className="text-2xl font-bold">{selected.name}</h2>
                  <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${severityClass(selected.severity)}`}>
                    Mức độ: {selected.severity}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Section icon={Leaf} title="Triệu chứng" content={selected.symptoms} color="text-success" />
                <Section icon={Bug} title="Nguyên nhân" content={selected.cause} color="text-warning" />
                <Section icon={AlertTriangle} title="Cách xử lý" content={selected.treatment} color="text-danger" />
                <Section icon={BookOpen} title="Phòng ngừa" content={selected.prevention} color="text-primary" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ icon: Icon, title, content, color }: { icon: typeof Leaf; title: string; content: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-accent/30 p-4">
      <div className={`mb-2 flex items-center gap-2 ${color}`}>
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{content}</p>
    </div>
  );
}
