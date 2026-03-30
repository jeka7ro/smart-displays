import React, { useEffect, useState, useCallback } from 'react';
import { locations as api, brands as brandsApi } from '../lib/api';
import { MapPin, Palette, Plus, Trash2, Pencil, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-800 rounded-2xl border border-white/[0.08] w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function LocationsSection() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.list(); setList(r.data); }
    catch { toast.error('Eroare la locații'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({ name: '', address: '', city: '' }); setSelected(null); setModal('add'); };
  const openEdit = (l) => { setForm({ name: l.name, address: l.address || '', city: l.city || '' }); setSelected(l); setModal('edit'); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Numele este obligatoriu'); return; }
    setSaving(true);
    try {
      if (modal === 'add') await api.create(form);
      else await api.update(selected.id, form);
      toast.success(modal === 'add' ? 'Locație creată!' : 'Actualizată!');
      setModal(null); load();
    } catch { toast.error('Eroare la salvare'); }
    finally { setSaving(false); }
  };

  const del = async (l) => {
    if (!window.confirm(`Ștergi locația „${l.name}"?`)) return;
    try { await api.delete(l.id); toast.success('Ștersă!'); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Eroare'); }
  };

  return (
    <div className="sd-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-400" />Locații</h2>
        <button onClick={openAdd} className="sd-btn-primary text-xs px-3 py-1.5"><Plus className="w-3.5 h-3.5" />Adaugă</button>
      </div>
      {loading ? <div className="text-white/30 text-sm text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      : list.length === 0 ? <div className="text-white/30 text-sm text-center py-6">Nicio locație configurată.</div>
      : (
        <table className="sd-table">
          <thead><tr><th>Nume</th><th>Oraș</th><th>Adresă</th><th></th></tr></thead>
          <tbody>
            {list.map(l => (
              <tr key={l.id}>
                <td className="font-medium text-white">{l.name}</td>
                <td className="text-white/50">{l.city || '—'}</td>
                <td className="text-white/50 max-w-xs truncate">{l.address || '—'}</td>
                <td>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(l)} className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => del(l)} className="p-1.5 rounded text-red-400/50 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Locație nouă' : 'Editează locație'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div><label className="sd-label">Nume*</label><input className="sd-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Restaurant Central" /></div>
            <div><label className="sd-label">Oraș</label><input className="sd-input" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="București" /></div>
            <div><label className="sd-label">Adresă</label><input className="sd-input" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Str. Exemplu 1" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="sd-btn-ghost flex-1 justify-center">Anulează</button>
              <button onClick={save} disabled={saving} className="sd-btn-primary flex-1 justify-center">{saving ? 'Se salvează...' : 'Salvează'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BrandsSection() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', logo_url: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await brandsApi.list(); setList(r.data); }
    catch { toast.error('Eroare la branduri'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({ name: '', logo_url: '' }); setSelected(null); setModal('add'); };
  const openEdit = (b) => { setForm({ name: b.name, logo_url: b.logo_url || '' }); setSelected(b); setModal('edit'); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Numele este obligatoriu'); return; }
    setSaving(true);
    try {
      if (modal === 'add') await brandsApi.create(form);
      else await brandsApi.update(selected.id, form);
      toast.success(modal === 'add' ? 'Brand creat!' : 'Actualizat!');
      setModal(null); load();
    } catch { toast.error('Eroare la salvare'); }
    finally { setSaving(false); }
  };

  const del = async (b) => {
    if (!window.confirm(`Ștergi brandul „${b.name}"?`)) return;
    try { await brandsApi.delete(b.id); toast.success('Șters!'); load(); }
    catch { toast.error('Eroare'); }
  };

  return (
    <div className="sd-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white flex items-center gap-2"><Palette className="w-4 h-4 text-brand-400" />Branduri (Logo Overlay)</h2>
        <button onClick={openAdd} className="sd-btn-primary text-xs px-3 py-1.5"><Plus className="w-3.5 h-3.5" />Adaugă</button>
      </div>
      {loading ? <div className="text-white/30 text-sm text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      : list.length === 0 ? <div className="text-white/30 text-sm text-center py-6">Niciun brand configurat.</div>
      : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list.map(b => (
            <div key={b.id} className="p-3 rounded-xl border border-white/[0.06] bg-surface-700 flex items-center gap-3">
              {b.logo_url
                ? <img src={b.logo_url} alt={b.name} className="w-10 h-10 object-contain rounded bg-white/5" />
                : <div className="w-10 h-10 rounded bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-sm">{b.name[0]}</div>
              }
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{b.name}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(b)} className="p-1 rounded text-white/30 hover:text-white"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => del(b)} className="p-1 rounded text-red-400/40 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Brand nou' : 'Editează brand'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div><label className="sd-label">Nume*</label><input className="sd-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Numele brandului" /></div>
            <div><label className="sd-label">URL Logo</label><input className="sd-input" value={form.logo_url} onChange={e => setForm(f => ({...f, logo_url: e.target.value}))} placeholder="https://exemplu.com/logo.png" /></div>
            {form.logo_url && <img src={form.logo_url} alt="preview" className="h-16 object-contain rounded border border-white/10" onError={e => e.target.style.display='none'} />}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="sd-btn-ghost flex-1 justify-center">Anulează</button>
              <button onClick={save} disabled={saving} className="sd-btn-primary flex-1 justify-center">{saving ? 'Se salvează...' : 'Salvează'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Locations() {
  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-white">Locații & Branduri</h1>
        <p className="text-white/40 text-sm mt-0.5">Gestionează locațiile fizice și brandurile asociate ecranelor</p>
      </div>
      <LocationsSection />
      <BrandsSection />
    </div>
  );
}
