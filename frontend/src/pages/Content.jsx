import React, { useEffect, useState, useRef, useCallback } from 'react';
import { content as api } from '../lib/api';
import { Film, Upload, Trash2, Edit2, Image, Video, Search, X, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

function UploadArea({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [drag, setDrag]           = useState(false);
  const [title, setTitle]         = useState('');
  const [file, setFile]           = useState(null);
  const inputRef = useRef();

  const reset = () => { setFile(null); setTitle(''); setProgress(0); };

  const doUpload = async () => {
    if (!file) return;
    if (!title.trim()) { toast.error('Adaugă un titlu înainte de upload'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title.trim());
      form.append('duration', file.type.startsWith('video') ? 0 : 10);
      await api.upload(form, setProgress);
      toast.success('Fișier încărcat!');
      reset(); onUploaded();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload eșuat');
    } finally { setUploading(false); setProgress(0); }
  };

  const pick = (f) => {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  return (
    <div className="sd-card">
      <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-brand-400" />Încarcă fișier nou</h3>
      {!file ? (
    <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
          onClick={() => inputRef.current?.click()}
          className="rounded-2xl p-10 text-center cursor-pointer transition-all duration-200"
          style={{
            border: `2px dashed ${drag ? 'rgba(99,87,255,0.6)' : 'rgba(255,255,255,0.08)'}`,
            background: drag ? 'rgba(99,87,255,0.06)' : 'rgba(255,255,255,0.02)',
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(99,87,255,0.1)', border: '1px solid rgba(99,87,255,0.15)' }}>
            <Upload className="w-5 h-5" style={{ color: '#818cf8' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Drag & drop sau <span style={{ color: '#818cf8' }}>alege fișier</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>MP4, JPG, PNG, GIF · max 500 MB</p>
          <input ref={inputRef} type="file" accept="video/*,image/*" className="hidden"
            onChange={e => { if (e.target.files[0]) pick(e.target.files[0]); }} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-700 border border-white/[0.06]">
            {file.type.startsWith('video') ? <Video className="w-5 h-5 text-purple-400 shrink-0" /> : <Image className="w-5 h-5 text-blue-400 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{file.name}</div>
              <div className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
            <button onClick={reset} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <label className="sd-label">Titlu</label>
            <input className="sd-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titlu fișier" />
          </div>
          {uploading && (
            <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={reset} disabled={uploading} className="sd-btn-ghost flex-1 justify-center">Anulează</button>
            <button onClick={doUpload} disabled={uploading} className="sd-btn-primary flex-1 justify-center">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {progress}%</> : 'Încarcă'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Content() {
  const [list, setList]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | video | image
  const [editing, setEditing] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api.list();
      setList(r.data);
    } catch { toast.error('Eroare la încărcarea conținutului'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (c) => {
    if (!window.confirm(`Ștergi „${c.title}"?`)) return;
    try { await api.delete(c.id); toast.success('Șters!'); load(); }
    catch { toast.error('Eroare la ștergere'); }
  };

  const rename = async () => {
    if (!newTitle.trim()) return;
    try { await api.rename(editing.id, newTitle.trim()); toast.success('Redenumit!'); setEditing(null); load(); }
    catch { toast.error('Eroare la redenumire'); }
  };

  const filtered = list.filter(c => {
    if (filter !== 'all' && c.type !== filter) return false;
    return c.title.toLowerCase().includes(search.toLowerCase());
  });

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Film className="w-5 h-5 text-brand-400" />Conținut</h1>
          <p className="text-white/40 text-sm mt-0.5">{list.length} fișiere · {list.filter(c => c.type === 'video').length} video · {list.filter(c => c.type === 'image').length} imagini</p>
        </div>
      </div>

      <UploadArea onUploaded={load} />

      {/* Search & filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input className="sd-input pl-9" placeholder="Caută..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {['all','video','image'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all"
              style={filter === f
                ? { background: 'linear-gradient(135deg,#5b4fff,#7c3aed)', color: 'white', boxShadow: '0 4px 12px rgba(91,79,255,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }
              }>
              {f === 'all' ? 'Toate' : f === 'video' ? '🎬 Video' : '🖼️ Imagini'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-white/30"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Se încarcă...</div>
      ) : filtered.length === 0 ? (
        <div className="sd-card text-center py-12">
          <Film className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">{search ? 'Niciun rezultat' : 'Nu ai conținut încărcat.'}</p>
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(c => (
            <div key={c.id} className="sd-card p-3 flex flex-col gap-2 group hover:scale-[1.02] transition-all duration-200" style={{ overflow: 'hidden' }}>
              {/* Thumbnail */}
              <div className="aspect-video rounded-2xl overflow-hidden flex items-center justify-center relative"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                ) : c.type === 'video' ? (
                  <Video className="w-6 h-6 text-purple-400" />
                ) : (
                  <Image className="w-6 h-6 text-blue-400" />
                )}
                <div className="absolute top-1 right-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.type === 'video' ? 'bg-purple-500/80 text-white' : 'bg-blue-500/80 text-white'}`}>
                    {c.type === 'video' ? 'VIDEO' : 'IMG'}
                  </span>
                </div>
              </div>

              {/* Title */}
              {editing?.id === c.id ? (
                <div className="space-y-1">
                  <input className="sd-input text-xs py-1" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') rename(); if (e.key === 'Escape') setEditing(null); }} autoFocus />
                  <div className="flex gap-1">
                    <button onClick={rename} className="flex-1 text-[10px] bg-brand-600 text-white rounded py-0.5">OK</button>
                    <button onClick={() => setEditing(null)} className="flex-1 text-[10px] bg-surface-700 text-white/50 rounded py-0.5">✕</button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/80 truncate" title={c.title}>{c.title}</div>
              )}

              {formatSize(c.file_size) && (
                <div className="text-[10px] text-white/30">{formatSize(c.file_size)}</div>
              )}

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(c); setNewTitle(c.title); }}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] text-white/50 hover:text-white py-1 rounded bg-white/5 hover:bg-white/10">
                  <Edit2 className="w-3 h-3" /> Redenumit
                </button>
                <button onClick={() => del(c)}
                  className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
