import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Shield, RefreshCw, Edit, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

export const Users = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    plan: 'trial',
    expires_at_date: '',
  });

  useEffect(() => {
    if (!isSuperAdmin()) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadOrgs();
  }, [isSuperAdmin, navigate]);

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/superadmin/organizations');
      setOrgs(response.data);
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error('Eroare la încărcarea organizațiilor');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (org) => {
    setSelectedOrg(org);
    // Parse the date
    let dateStr = '';
    if (org.plan_expires_at) {
      const d = new Date(org.plan_expires_at);
      if (!isNaN(d)) {
        dateStr = d.toISOString().split('T')[0];
      }
    }
    setEditFormData({
      plan: org.plan || 'trial',
      expires_at_date: dateStr,
    });
    setShowEditDialog(true);
  };

  const handleUpdatePlan = async () => {
    if (!selectedOrg) return;
    try {
      setUpdating(true);
      
      let expires_at = null;
      if (editFormData.expires_at_date) {
        expires_at = new Date(editFormData.expires_at_date).toISOString();
      }

      await api.post(`/superadmin/organizations/${selectedOrg.org_id}/plan`, {
        plan: editFormData.plan,
        expires_at: expires_at,
      });

      toast.success('Abonament actualizat cu succes!');
      setShowEditDialog(false);
      loadOrgs();
    } catch (error) {
      toast.error('Eroare la actualizarea abonamentului');
    } finally {
      setUpdating(false);
    }
  };

  if (!isSuperAdmin()) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full animate-in fade-in zoom-in-95 duration-300 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              Super Admin - Clienți
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Vizualizează și gestionează toate conturile și abonamentele înregistrate pe platformă.
            </p>
          </div>
          <Button 
            onClick={loadOrgs} 
            variant="outline" 
            className="shadow-sm border-gray-200"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reîncarcă datele
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">Organizație (Companie)</th>
                  <th className="px-6 py-4">Proprietar</th>
                  <th className="px-6 py-4">Data Înregistrării</th>
                  <th className="px-6 py-4">Abonament</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      Se încarcă clienții...
                    </td>
                  </tr>
                ) : orgs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      Niciun client înregistrat.
                    </td>
                  </tr>
                ) : (
                  orgs.map((org) => (
                    <tr 
                      key={org.org_id} 
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{org.org_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">ID: {org.org_id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{org.owner_name}</div>
                        <div className="text-xs text-gray-500">{org.owner_email}</div>
                        {org.owner_phone && <div className="text-xs text-gray-500">{org.owner_phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(org.created_at).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          org.plan === 'trial' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                          org.plan === 'year' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          org.plan === 'month' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {org.plan === 'trial' ? 'Trial' :
                           org.plan === 'year' ? '1 An B2B' :
                           org.plan === 'month' ? '1 Lună B2B' :
                           org.plan === 'lifetime' ? 'Lifetime' : org.plan}
                        </span>
                        {org.plan_expires_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expiră: {new Date(org.plan_expires_at).toLocaleDateString('ro-RO')}
                          </div>
                        )}
                        {org.plan_recurring && (
                          <div className="text-xs text-indigo-500 font-medium mt-0.5">Auto-Reînnoire</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(org)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Edit className="w-4 h-4 mr-1.5" />
                          Editează Abonament
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-xl rounded-2xl">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Editează Abonament
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-5">
            {selectedOrg && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600">Client: <span className="font-semibold text-gray-900">{selectedOrg.org_name}</span></p>
                <p className="text-xs text-gray-500 mt-1">Email: {selectedOrg.owner_email}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Tip Abonament</label>
              <Select 
                value={editFormData.plan} 
                onValueChange={(val) => setEditFormData({...editFormData, plan: val})}
              >
                <SelectTrigger className="w-full h-11 border-gray-200">
                  <SelectValue placeholder="Selectează plan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial (Gratuit)</SelectItem>
                  <SelectItem value="month">1 Lună B2B</SelectItem>
                  <SelectItem value="year">1 An B2B</SelectItem>
                  <SelectItem value="lifetime">Lifetime / Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Data Expirării</label>
              <input
                type="date"
                value={editFormData.expires_at_date}
                onChange={(e) => setEditFormData({...editFormData, expires_at_date: e.target.value})}
                className="w-full h-11 px-3 border border-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500">
                Alege data până la care abonamentul este valabil. Lasă gol dacă nu expiră.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={updating}>
              Renunță
            </Button>
            <Button 
              onClick={handleUpdatePlan} 
              disabled={updating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              {updating ? 'Se salvează...' : 'Salvează Modificările'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Users;
