import React, { useEffect, useState, useCallback } from 'react';
import { playlists as api, content as contentApi } from '../lib/api';
import { ListVideo, Plus, Trash2, Pencil, GripVertical, X, Loader2, Image, Video, Clock } from 'lucide-react';
import { toast } from 'sonner';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" style={{
        background: 'rgba(12,15,30,0.97)',
        borderRadius: 28,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(24px)',
      }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="font-bold text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const BLANK = { name: '', description: '', items: [], autoplay: true, loop: true, status: 'active', color: '#4F46E5' };

export default function Playlists() {
  const [list, setList]           = useState([]);
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(BLANK);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([api.list(), contentApi.list()]);
      setList(pRes.data); setContentList(cRes.data);
    } catch { toast.error('Eroare la încărcare'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(BLANK); setSelected(null); setModal('add'); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', items: Array.isArray(p.items) ? p.items : [],
              autoplay: p.autoplay ?? true, loop: p.loop ?? true, status: p.status || 'active', color: p.color || '#4F46E5' });
    setSelected(p); setModal('edit');
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Numele este obligatoriu'); return; }
    setSaving(true);
    try {
      if (modal === 'add') await api.create(form);
      else await api.update(selected.id, form);
      toast.success(modal === 'add' ? 'Playlist creat!' : 'Actualizat!');
      setModal(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Eroare'); }
    finally { setSaving(false); }
  };

  const del = async (p) => {
    if (!window.confirm(`Ștergi „${p.name}"?`)) return;
    try { await api.delete(p.id); toast.success('Șters!'); load(); }
    catch { toast.error('Eroare la ștergere'); }
  };

  const addItem = (contentId) => {
    const c = contentList.find(c => c.id === contentId);
    if (!c) return;
    setForm(f => ({ ...f, items: [...f.items, { content_id: c.id, title: c.title, type: c.type, duration: c.duration || 10 }] }));
  };
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateDuration = (idx, dur) => setForm(f => ({
    ...f, items: f.items.map((item, i) => i === idx ? { ...item, duration: parseInt(dur) || 10 } : item)
  }));

  const totalDuration = (items) => {
    const secs = (items || []).reduce((a, it) => a + (it.duration || 10), 0);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  return (
    <div className="space-y-5 animate-slide-up max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ListVideo className="w-6 h-6" style={{ color: '#818cf8' }} /> Playlisturi
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{list.length} playlisturi</p>
        </div>
        <button onClick={openAdd} className="sd-btn-primary"><Plus className="w-4 h-4" />Playlist nou</button>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Se încarcă...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="sd-card text-center py-16">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ListVideo className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Nu ai niciun playlist creat.</p>
          <button onClick={openAdd} className="sd-btn-primary">Creează primul playlist</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(p => {
            const items = Array.isArray(p.items) ? p.items : [];
            return (
              <div key={p.id} className="sd-card flex flex-col gap-3 hover:scale-[1.01] transition-all duration-200"
                style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Color accent glow */}
                <div style={{
                  position: 'absolute', top: -12, left: -12, width: 56, height: 56,
                  borderRadius: '50%', filter: 'blur(18px)',
                  opacity: 0.25, background: p.color || '#4F46E5', pointerEvents: 'none',
                }} />

                <div className="flex items-start justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-2xl shrink-0" style={{ background: p.color || '#4F46E5' }} />
                    <div>
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      {p.description && <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.description}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-xl transition-all"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(p)} className="p-1.5 rounded-xl transition-all"
                      style={{ color: 'rgba(239,68,68,0.4)' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#f87171'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(239,68,68,0.4)'; }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-xs italic text-center py-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Playlist gol</div>
                  ) : items.map((it, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}>
                      {it.type === 'video'
                        ? <Video className="w-3 h-3 shrink-0" style={{ color: '#c084fc' }} />
                        : <Image className="w-3 h-3 shrink-0" style={{ color: '#60a5fa' }} />}
                      <span className="flex-1 truncate">{it.title}</span>
                      <span style={{ color: 'rgba(255,255,255,0.25)' }}>{it.duration}s</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                  <span>{items.length} fișiere</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{totalDuration(items)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Playlist nou' : `Editează — ${selected?.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sd-label">Nume*</label>
                <input className="sd-input" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Promo Vara" />
              </div>
              <div>
                <label className="sd-label">Culoare</label>
                <input type="color" className="w-full h-10 rounded-2xl cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="sd-label">Descriere</label>
              <input className="sd-input" value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Opțional" />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="sd-label mb-0">Fișiere în playlist</label>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {form.items.length} fișiere · {totalDuration(form.items)}
                </span>
              </div>
              <div className="space-y-1.5 mb-3 max-h-52 overflow-y-auto">
                {form.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <GripVertical className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    {it.type === 'video'
                      ? <Video className="w-4 h-4 shrink-0" style={{ color: '#c084fc' }} />
                      : <Image className="w-4 h-4 shrink-0" style={{ color: '#60a5fa' }} />}
                    <span className="flex-1 text-xs text-white/70 truncate">{it.title}</span>
                    <input type="number" min="1" max="3600" value={it.duration}
                      onChange={e => updateDuration(i, e.target.value)}
                      className="w-16 text-xs rounded-xl px-2 py-1 text-white text-center"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>s</span>
                    <button onClick={() => removeItem(i)} style={{ color: 'rgba(239,68,68,0.5)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {form.items.length === 0 && (
                  <div className="text-center py-4 text-xs rounded-2xl"
                    style={{ color: 'rgba(255,255,255,0.25)', border: '2px dashed rgba(255,255,255,0.06)' }}>
                    Adaugă fișiere de mai jos
                  </div>
                )}
              </div>
              <div>
                <label className="sd-label">Adaugă fișier</label>
                <select className="sd-input" onChange={e => { if (e.target.value) { addItem(e.target.value); e.target.value = ''; } }}>
                  <option value="">— Alege fișier —</option>
                  {contentList.map(c => (
                    <option key={c.id} value={c.id}>{c.type === 'video' ? '🎬' : '🖼️'} {c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input type="checkbox" checked={form.autoplay}
                  onChange={e => setForm(f => ({...f, autoplay: e.target.checked}))} className="accent-violet-500" />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Autoplay</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input type="checkbox" checked={form.loop}
                  onChange={e => setForm(f => ({...f, loop: e.target.checked}))} className="accent-violet-500" />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Loop</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="sd-btn-ghost flex-1 justify-center">Anulează</button>
              <button onClick={save} disabled={saving} className="sd-btn-primary flex-1 justify-center">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Se salvează...</> : 'Salvează'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
