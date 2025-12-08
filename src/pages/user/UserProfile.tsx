import { useState, useEffect } from 'react';
import { User, Mail, Phone, Edit2, Save, X, Loader } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import UserHeader from '../../components/UserHeader';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

interface PerfilProps {}

interface Owner {
  idOwner: number;
  ownerName: string;
  email: string;
  phone: string;
  cellPhone: string;
  ci: string;
}

interface Horse {
  horseName: string;
}

export function UserProfile(_: PerfilProps) {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    ownerName: '',
    email: '',
    phone: '',
    cellPhone: ''
  });

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No hay sesión activa');
        return;
      }

      // Get owner data directly by uid - try query param approach
      const ownerRes = await fetch(`http://localhost:8000/owner/?uid=${user.id}`);
      
      let ownerData;
      if (ownerRes.status === 404 || !ownerRes.ok) {
        // If query param doesn't work, try getting all owners and filter
        const allOwnersRes = await fetch(`http://localhost:8000/owner/`);
        if (!allOwnersRes.ok) {
          toast.error('Tu usuario no está registrado como propietario. Contacta al administrador.');
          console.log('Usuario no encontrado como owner:', user.id);
          return;
        }
        const allOwners = await allOwnersRes.json();
        ownerData = allOwners.find((o: any) => o.uid === user.id);
        
        if (!ownerData) {
          toast.error('Tu usuario no está registrado como propietario. Contacta al administrador.');
          console.log('Usuario no encontrado como owner:', user.id);
          return;
        }
      } else {
        const result = await ownerRes.json();
        // If it's an array, find the matching uid; otherwise use directly
        if (Array.isArray(result)) {
          ownerData = result.find((o: any) => o.uid === user.id);
          if (!ownerData) {
            toast.error('Tu usuario no está registrado como propietario. Contacta al administrador.');
            console.log('Usuario no encontrado en array de owners:', user.id);
            return;
          }
        } else {
          ownerData = result;
        }
      }
      
      setOwner(ownerData);
      setEditForm({
        ownerName: ownerData.ownerName || '',
        email: ownerData.email || '',
        phone: ownerData.phone || '',
        cellPhone: ownerData.cellPhone || ''
      });

      // Get horses by owner
      const horsesRes = await fetch(`http://localhost:8000/horses/by_owner/${ownerData.idOwner}`);
      if (horsesRes.ok) {
        setHorses(await horsesRes.json());
      }
      
    } catch (error: any) {
      console.error('Error fetching owner data:', error);
      toast.error('Error al cargar datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!owner) return;

    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:8000/owners/${owner.idOwner}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...owner,
          ownerName: editForm.ownerName,
          email: editForm.email,
          phone: editForm.phone,
          cellPhone: editForm.cellPhone
        })
      });

      if (!response.ok) throw new Error('Error al actualizar perfil');

      const updatedOwner = await response.json();
      setOwner(updatedOwner);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
      
    } catch (error: any) {
      console.error('Error updating owner:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !owner) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-cyan-500" />
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Mi Perfil" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl text-white mb-1">{owner.ownerName}</h2>
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
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex-1 sm:flex-initial"
                  >
                    {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        ownerName: owner.ownerName || '',
                        email: owner.email || '',
                        phone: owner.phone || '',
                        cellPhone: owner.cellPhone || ''
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
                      <Input 
                        value={editForm.ownerName}
                        onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-sm text-white">{owner.ownerName}</p>
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
                      <p className="text-sm text-white break-all">{owner.email || 'No especificado'}</p>
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
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-sm text-white">{owner.phone || 'No especificado'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Celular</p>
                    {isEditing ? (
                      <Input 
                        value={editForm.cellPhone}
                        onChange={(e) => setEditForm({ ...editForm, cellPhone: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-sm text-white">{owner.cellPhone || 'No especificado'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Membership Info */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg text-white mb-6">Información de membresía</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Tipo de membresía</span>
                <span className="text-sm text-cyan-400">Premium</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Fecha de inicio</span>
                <span className="text-sm text-white">01/03/2021</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Estado</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-emerald-400">Activa</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Renovación próxima</span>
                <span className="text-sm text-white">01/03/2026</span>
              </div>
            </div>
          </div>
        </Card>

        {/* My Horses */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg text-white mb-6">Mis caballos</h3>
            {horses.length === 0 ? (
              <p className="text-center text-slate-400">No tienes caballos registrados</p>
            ) : (
              <div className="space-y-3">
                {horses.map((horse, index) => (
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
                <span className="text-sm text-slate-300">ID de Propietario</span>
                <span className="text-sm text-cyan-400">#{owner.idOwner}</span>
              </div>
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
  );
}
