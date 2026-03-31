import React, { useEffect, useState, useCallback } from 'react';
import { screens as api, locations, content as contentApi, playlists as playlistsApi, brands } from '../lib/api';
import { Tv, Plus, Pencil, Trash2, Wifi, WifiOff, Copy, ExternalLink, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

const EFFECTS_LIST = [
  { key: 'snow_enabled',             label: '❄️ Ninsoare' },
  { key: 'sakura_enabled',           label: '🌸 Sakura' },
  { key: 'valentine_hearts_enabled', label: '❤️ Inimi' },
  { key: 'parallax_enabled',         label: '🌊 Parallax' },
  { key: 'steam_enabled',            label: '💨 Aburi' },
];

const BLANK_SCREEN = {
  name: '', slug: '', location_id: '', resolution: '1920x1080', orientation: '0',
  snow_enabled: false, snow_intensity: 'low',
  sakura_enabled: false, sakura_intensity: 'low',
  valentine_hearts_enabled: false, valentine_hearts_intensity: 'low',
  parallax_enabled: false, steam_enabled: false,
  logo_enabled: false, logo_brand_id: '', logo_position: 'top-right', logo_size: 'md',
  custom_text_enabled: false, custom_text_content: '', custom_text_position: 'bottom-center',
  custom_text_size: 'md', custom_text_color: '#FFFFFF', custom_text_has_background: false,
};

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

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
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function AssignModal({ screen, onClose, contentList, playlistList }) {
  const [contentId, setContentId] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [mode, setMode] = useState('content');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.assign(screen.id, {
        zone_id: 'main', content_type: mode === 'content' ? 'single_content' : 'playlist',
        content_id: mode === 'content' ? contentId || null : null,
        playlist_id: mode === 'playlist' ? playlistId || null : null,
      });
      toast.success('Conținut asignat cu succes!');
      onClose();
    } catch { toast.error('Eroare la asignare'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`Asignează conținut — ${screen.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setMode('content')} className={`sd-btn flex-1 justify-center ${mode === 'content' ? 'sd-btn-primary' : 'sd-btn-ghost'}`}>Fișier</button>
          <button onClick={() => setMode('playlist')} className={`sd-btn flex-1 justify-center ${mode === 'playlist' ? 'sd-btn-primary' : 'sd-btn-ghost'}`}>Playlist</button>
        </div>
        {mode === 'content' ? (
          <select className="sd-input" value={contentId} onChange={e => setContentId(e.target.value)}>
            <option value="">— Fără conținut —</option>
            {contentList.map(c => <option key={c.id} value={c.id}>{c.type === 'video' ? '🎬' : '🖼️'} {c.title}</option>)}
          </select>
        ) : (
          <select className="sd-input" value={playlistId} onChange={e => setPlaylistId(e.target.value)}>
            <option value="">— Fără playlist —</option>
            {playlistList.map(p => <option key={p.id} value={p.id}>📋 {p.name}</option>)}
          </select>
        )}
        <button onClick={save} disabled={saving} className="sd-btn-primary w-full justify-center">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Se salvează...</> : 'Salvează'}
        </button>
      </div>
    </Modal>
  );
}

export default function Screens() {
  const [list, setList]                 = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [contentList, setContentList]   = useState([]);
  const [playlistList, setPlaylistList] = useState([]);
  const [brandList, setBrandList]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null);
  const [selected, setSelected]         = useState(null);
  const [form, setForm]                 = useState(BLANK_SCREEN);
  const [saving, setSaving]             = useState(false);
  const [search, setSearch]             = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, lRes, cRes, pRes, bRes] = await Promise.all([
        api.list(), locations.list(), contentApi.list(), playlistsApi.list(), brands.list()
      ]);
      setList(sRes.data); setLocationList(lRes.data);
      setContentList(cRes.data); setPlaylistList(pRes.data); setBrandList(bRes.data);
    } catch { toast.error('Eroare la încărcarea ecranelor'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd    = () => { setForm(BLANK_SCREEN); setSelected(null); setModal('add'); };
  const openEdit   = (s) => { setForm({ ...BLANK_SCREEN, ...s }); setSelected(s); setModal('edit'); };
  const openAssign = (s) => { setSelected(s); setModal('assign'); };

  const save = async () => {
    if (!form.name || !form.slug) { toast.error('Numele și slug-ul sunt obligatorii'); return; }
    setSaving(true);
    try {
      if (modal === 'add') await api.create(form);
      else await api.update(selected.id, form);
      toast.success(modal === 'add' ? 'Ecran creat!' : 'Ecran actualizat!');
      setModal(null); load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Eroare la salvare');
    } finally { setSaving(false); }
  };

  const del = async (s) => {
    if (!window.confirm(`Ștergi ecranul „${s.name}"?`)) return;
    try { await api.delete(s.id); toast.success('Ecran șters'); load(); }
    catch { toast.error('Eroare la ștergere'); }
  };

  const tvUrl   = (slug) => `${BACKEND}/tv/${slug}`;
  const filtered = list.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase()) ||
    (s.location_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-slide-up max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Tv className="w-6 h-6" style={{ color: '#818cf8' }} /> Ecrane
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {list.length} ecrane configurate
          </p>
        </div>
        <button onClick={openAdd} className="sd-btn-primary">
          <Plus className="w-4 h-4" /> Adaugă ecran
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
        <input className="sd-input pl-9" placeholder="Caută ecrane..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p className="text-sm">Se încarcă...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="sd-card text-center py-16">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Tv className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {search ? 'Niciun ecran găsit' : 'Niciun ecran configurat.'}
          </p>
          {!search && <button onClick={openAdd} className="sd-btn-primary">Adaugă primul ecran</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="sd-card flex flex-col gap-3 hover:scale-[1.01] transition-all duration-200"
              style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Status glow */}
              <div style={{
                position: 'absolute', top: -16, right: -16, width: 60, height: 60,
                borderRadius: '50%', filter: 'blur(20px)', opacity: 0.2,
                background: s.status === 'online' ? '#10b981' : '#374151', pointerEvents: 'none',
              }} />

              <div className="flex items-start justify-between relative">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{s.name}</span>
                    {s.status === 'online'
                      ? <span className="sd-badge-green"><Wifi className="w-2.5 h-2.5" />Online</span>
                      : <span className="sd-badge-red"><WifiOff className="w-2.5 h-2.5" />Offline</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {s.location_name || 'Fără locație'} · {s.resolution}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-xl transition-all"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => del(s)} className="p-1.5 rounded-xl transition-all"
                    style={{ color: 'rgba(239,68,68,0.4)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.4)'; }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <code className="flex-1 px-2 py-1.5 rounded-xl truncate"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  /tv/{s.slug}
                </code>
                <button onClick={() => { navigator.clipboard.writeText(tvUrl(s.slug)); toast.success('URL copiat!'); }}
                  className="p-1.5 rounded-xl transition-all" style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                  <Copy className="w-3 h-3" />
                </button>
                <a href={tvUrl(s.slug)} target="_blank" rel="noreferrer"
                  className="p-1.5 rounded-xl transition-all" style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {EFFECTS_LIST.filter(ef => s[ef.key]).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {EFFECTS_LIST.filter(ef => s[ef.key]).map(ef => (
                    <span key={ef.key} className="sd-badge-blue" style={{ fontSize: 10 }}>{ef.label}</span>
                  ))}
                </div>
              )}

              <button onClick={() => openAssign(s)} className="sd-btn-ghost text-xs w-full justify-center py-2 mt-1">
                📺 Asignează conținut
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Ecran nou' : `Editează — ${selected?.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sd-label">Nume ecran*</label>
                <input className="sd-input" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Ecran Intrare" />
              </div>
              <div>
                <label className="sd-label">Slug (URL unic)*</label>
                <input className="sd-input" value={form.slug}
                  onChange={e => setForm(f => ({...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}))}
                  placeholder="ecran-intrare" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sd-label">Locație</label>
                <select className="sd-input" value={form.location_id} onChange={e => setForm(f => ({...f, location_id: e.target.value}))}>
                  <option value="">— Fără locație —</option>
                  {locationList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="sd-label">Rezoluție</label>
                <select className="sd-input" value={form.resolution} onChange={e => setForm(f => ({...f, resolution: e.target.value}))}>
                  {['1920x1080','3840x2160','1280x720','1080x1920'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="sd-label">Efecte vizuale</label>
              <div className="grid grid-cols-2 gap-2">
                {EFFECTS_LIST.map(ef => (
                  <label key={ef.key} className="flex items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <input type="checkbox" checked={!!form[ef.key]}
                      onChange={e => setForm(f => ({...f, [ef.key]: e.target.checked}))}
                      className="accent-violet-500" />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{ef.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" checked={form.logo_enabled}
                  onChange={e => setForm(f => ({...f, logo_enabled: e.target.checked}))}
                  className="accent-violet-500" />
                <span className="text-sm font-medium text-white">Logo overlay</span>
              </label>
              {form.logo_enabled && (
                <div className="grid grid-cols-3 gap-2 pl-6">
                  <div>
                    <label className="sd-label">Brand</label>
                    <select className="sd-input" value={form.logo_brand_id} onChange={e => setForm(f => ({...f, logo_brand_id: e.target.value}))}>
                      <option value="">— Alege —</option>
                      {brandList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="sd-label">Poziție</label>
                    <select className="sd-input" value={form.logo_position} onChange={e => setForm(f => ({...f, logo_position: e.target.value}))}>
                      {['top-left','top-center','top-right','bottom-left','bottom-center','bottom-right'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="sd-label">Mărime</label>
                    <select className="sd-input" value={form.logo_size} onChange={e => setForm(f => ({...f, logo_size: e.target.value}))}>
                      {['sm','md','lg','xl'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="sd-btn-ghost flex-1 justify-center">Anulează</button>
              <button onClick={save} disabled={saving} className="sd-btn-primary flex-1 justify-center">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Se salvează...</> : 'Salvează'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Modal */}
      {modal === 'assign' && selected && (
        <AssignModal screen={selected} onClose={() => { setModal(null); load(); }}
          contentList={contentList} playlistList={playlistList} />
      )}
    </div>
  );
}
