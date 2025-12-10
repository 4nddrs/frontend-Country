import { useState, useEffect } from 'react';
import { User, Mail, Phone, Edit2, Save, X, Loader } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import UserHeader from '../../components/UserHeader';
import { useCurrentUser, useOwnerData, useOwnerHorses } from '../../hooks/useUserData';
import { updateOwner, type Horse } from '../../services/userService';
import { toast } from 'react-hot-toast';
import { decodeBackendImage } from '../../utils/imageHelpers';

interface PerfilProps {}

export function UserProfile(_: PerfilProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    FirstName: '',
    SecondName: '',
    email: '',
    phoneNumber: '',
    ci: ''
  });
  const [saving, setSaving] = useState(false);

  // Usar hooks optimizados con React Query
  const { data: user } = useCurrentUser();
  const { data: ownerData, isLoading: ownerLoading, refetch: refetchOwner } = useOwnerData(user?.id);
  const { data: horses = [], isLoading: horsesLoading } = useOwnerHorses(ownerData?.idOwner);

  const loading = ownerLoading || horsesLoading;
  const owner = ownerData;
  const horsesList = horses as Horse[];

  useEffect(() => {
    if (owner) {
      setEditForm({
        name: owner.name || '',
        FirstName: owner.FirstName || '',
        SecondName: owner.SecondName || '',
        email: owner.email || user?.email || '',
        phoneNumber: owner.phoneNumber?.toString() || '',
        ci: owner.ci?.toString() || ''
      });
    }
  }, [owner, user]);

  const handleSave = async () => {
    if (!owner) return;

    try {
      setSaving(true);
      
      await updateOwner(owner.idOwner, {
        name: editForm.name,
        FirstName: editForm.FirstName,
        SecondName: editForm.SecondName,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        ci: editForm.ci
      });

      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
      await refetchOwner(); // Refrescar datos desde el servidor
      
    } catch (error: any) {
      console.error('Error updating owner:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !owner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <UserHeader title="Mi Perfil" />
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm p-8 text-center">
            <p className="text-slate-400">No se encontraron datos del perfil</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl m-6 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <UserHeader title="Mi Perfil" />

        <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                {ownerData?.ownerPhoto ? (
                  <img 
                    src={decodeBackendImage(ownerData.ownerPhoto)} 
                    alt={owner.name || owner.FirstName || 'Owner'} 
                    className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-cyan-500/20 border-2 border-cyan-400/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-semibold text-teal-400 mb-1">
                    {owner.name || `${owner.FirstName || ''} ${owner.SecondName || ''}`.trim() || 'Sin nombre'}
                  </h2>
                  <p className="text-sm text-slate-400">CI: {owner.ci || 'No especificado'}</p>
                </div>
              </div>
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/20 w-full sm:w-auto"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar perfil
                </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex-1 sm:flex-initial"
                  >
                    {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        name: owner.name || '',
                        FirstName: owner.FirstName || '',
                        SecondName: owner.SecondName || '',
                        email: owner.email || user?.email || '',
                        phoneNumber: owner.phoneNumber?.toString() || '',
                        ci: owner.ci?.toString() || ''
                      });
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 mb-1">Nombre completo</p>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input 
                          placeholder="Nombre"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Input 
                          placeholder="Primer Apellido"
                          value={editForm.FirstName}
                          onChange={(e) => setEditForm({ ...editForm, FirstName: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Input 
                          placeholder="Segundo Apellido"
                          value={editForm.SecondName}
                          onChange={(e) => setEditForm({ ...editForm, SecondName: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-white">
                        {owner.name || `${owner.FirstName || ''} ${owner.SecondName || ''}`.trim() || 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 mb-1">Cédula de Identidad</p>
                    {isEditing ? (
                      <Input 
                        value={editForm.ci}
                        onChange={(e) => setEditForm({ ...editForm, ci: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-sm text-white">{owner.ci || 'No especificado'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    {isEditing ? (
                      <Input 
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-sm text-white break-all">{user?.email || owner.email || 'No especificado'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Teléfono</p>
                    {isEditing ? (
                      <Input 
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-sm text-white">{owner.phoneNumber || 'No especificado'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* My Horses */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg text-white mb-6">Mis caballos</h3>
            {horsesList.length === 0 ? (
              <p className="text-center text-slate-400">No tienes caballos registrados</p>
            ) : (
              <div className="space-y-3">
                {horsesList.map((horse: Horse, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                    <div>
                      <p className="text-sm text-white mb-1">{horse.horseName}</p>
                      <p className="text-xs text-slate-400">Ver detalles en "Mi Caballo"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-emerald-400">Activo</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ID Card */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg text-white mb-6">Información adicional</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Documento de identidad</span>
                <span className="text-sm text-white">{owner.ci || 'No registrado'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Total de caballos</span>
                <span className="text-sm text-white">{horses.length}</span>
              </div>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
