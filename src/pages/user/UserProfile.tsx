import { useEffect, useRef, useState } from 'react';
import { Camera, Edit2, Loader, Mail, Save, User, X, Heart, BedDouble } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import UserHeader from '../../components/UserHeader';
import { useCurrentUser, useOwnerData, useOwnerHorses } from '../../hooks/useUserData';
import { isNumeric } from '../../utils/validation';
import {
  getNutritionalPlanById,
  getRaceById,
  type Horse,
  updateOwner,
  uploadOwnerImage,
} from '../../services/userService';
import { toast } from 'react-hot-toast';
import { decodeBackendImage } from '../../utils/imageHelpers';
import { getOwnerImageUrl } from '../../utils/supabaseStorageHelpers';

interface PerfilProps {}

type HorseSummary = {
  raceName: string;
  planName: string;
  planDescription?: string;
  hasBox: boolean;
  boxLabel: string;
  boxPeriod?: string;
};

export function UserProfile(_: PerfilProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    phoneNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [horseSummaries, setHorseSummaries] = useState<Record<number, HorseSummary>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user } = useCurrentUser();
  const { data: ownerData, isLoading: ownerLoading, refetch: refetchOwner } = useOwnerData(user?.id);
  const { data: horses = [], isLoading: horsesLoading } = useOwnerHorses(ownerData?.idOwner);

  const loading = ownerLoading || horsesLoading;
  const owner = ownerData;
  const horsesList = horses as Horse[];

  useEffect(() => {
    setEditForm({
      email: owner?.email || user?.email || '',
      phoneNumber: owner?.phoneNumber?.toString() || owner?.phone?.toString() || '',
    });
  }, [owner, user]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  useEffect(() => {
    let cancelled = false;

    const loadHorseSummaries = async () => {
      if (horsesList.length === 0) {
        setHorseSummaries({});
        return;
      }

      const entries = await Promise.all(
        horsesList.map(async (horse) => {
          let planName = 'Sin plan asignado';
          let planDescription: string | undefined;

          // Obtener plan nutricional directamente del objeto horse
          try {
            const planId = (horse as any)?.fl_idNutritionalPlan;
            
            if (planId) {
              const plan = await getNutritionalPlanById(planId);
              if (plan?.name) {
                planName = plan.name;
                planDescription = plan.description || undefined;
              }
            }
          } catch (error) {
            console.error('Error loading nutritional plan:', error);
          }

          let hasBox = false;
          let boxLabel = 'Sin box';
          let boxPeriod: string | undefined;

          // El box está guardado directamente en el objeto horse
          if (horse.box) {
            hasBox = true;
            boxLabel = 'Con box';
          }

          // Obtener la raza
          let raceName = 'Sin especificar';
          if (horse.race?.nameRace) {
            raceName = horse.race.nameRace;
          } else if (horse.fk_idRace) {
            try {
              const race = await getRaceById(horse.fk_idRace);
              raceName = race?.nameRace ?? 'Sin especificar';
            } catch (error) {
              console.error('Error loading race:', error);
            }
          }

          return [horse.idHorse, {
            raceName,
            planName,
            planDescription,
            hasBox,
            boxLabel,
            boxPeriod,
          }] as const;
        })
      );

      if (!cancelled) {
        setHorseSummaries(Object.fromEntries(entries));
      }
    };

    loadHorseSummaries();

    return () => {
      cancelled = true;
    };
  }, [horsesList]);

  const ownerPhotoSource = owner?.ownerPhoto
    ? getOwnerImageUrl(owner.ownerPhoto) || decodeBackendImage(owner.ownerPhoto)
    : null;

  const handleSave = async () => {
    if (!owner) return;

    // Validate phone number
    if (editForm.phoneNumber.trim() === '') {
      toast.error('El número de teléfono es obligatorio.');
      return;
    }
    if (editForm.phoneNumber.length !== 8) {
      toast.error('El número de teléfono debe tener exactamente 8 dígitos.');
      return;
    }
    if (!isNumeric(editForm.phoneNumber)) {
      toast.error('El número de teléfono debe contener solo dígitos.');
      return;
    }

    try {
      setSaving(true);

      await updateOwner(owner.idOwner, {
        phoneNumber: editForm.phoneNumber,
      });

      if (photoFile) {
        await uploadOwnerImage(owner.idOwner, photoFile);
      }

      setIsEditing(false);
      setPhotoFile(null);
      toast.success('Perfil actualizado correctamente');
      await refetchOwner();
    } catch (error: any) {
      console.error('Error updating owner:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !owner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
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

  const ownerDisplayName = owner.name || `${owner.FirstName || ''} ${owner.SecondName || ''}`.trim() || 'Sin nombre';
  const ownerCi = owner.ci || 'No especificado';
  const ownerEmail = user?.email || owner.email || 'No especificado';
  const ownerPhone = owner.phoneNumber || owner.phone || 'No especificado';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-white/0 backdrop-blur-lg p-4 md:p-6 rounded-2xl m-4 md:m-6 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <UserHeader title="Mi Perfil" />

        <div className="max-w-6xl mx-auto space-y-5 md:space-y-6">
          <Card className="relative overflow-hidden border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/80 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.15),transparent_35%)]" />
            <div className="relative p-5 md:p-7 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 flex-1">
                  <div className="relative shrink-0">
                    {photoPreview || ownerPhotoSource ? (
                      <img
                        src={photoPreview || ownerPhotoSource || ''}
                        alt={ownerDisplayName}
                        className="w-24 h-24 md:w-28 md:h-28 rounded-[28px] object-cover border-2 border-cyan-400/30 shadow-[0_12px_40px_rgba(8,145,178,0.35)]"
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-[28px] bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center border-2 border-cyan-400/30 shadow-[0_12px_40px_rgba(8,145,178,0.25)]">
                        <User className="w-11 h-11 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-slate-950 border border-cyan-400/30 flex items-center justify-center shadow-lg">
                      <Camera className="h-4 w-4 text-cyan-300" />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80 mb-2">Rol Dueño</p>
                      <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">{ownerDisplayName}</h2>
                      <p className="text-sm text-slate-400 mt-1">Cédula de identidad: {ownerCi}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-2 max-w-2xl">
                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">Caballos registrados</p>
                        <p className="text-lg font-semibold text-white">{horsesList.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">Estado de cuenta</p>
                        <p className="text-lg font-semibold text-emerald-400">Activo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5 md:gap-6">
            <Card className="border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/60 backdrop-blur-sm shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-11 w-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Datos de contacto</h3>
                    <p className="text-sm text-slate-400">Solo teléfono y foto son editables</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Nombre completo</p>
                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-white">
                        {ownerDisplayName}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cédula de identidad</p>
                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-white">
                        {ownerCi}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</label>
                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-white break-all">
                        {ownerEmail}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Teléfono (8 dígitos)</label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={editForm.phoneNumber}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                            setEditForm({ ...editForm, phoneNumber: digits });
                          }}
                          placeholder="Ej: 76543210"
                          maxLength={8}
                          className="w-full bg-slate-950/50 border-slate-700 text-white"
                        />
                      ) : (
                        <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-white">
                          {ownerPhone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Foto de perfil</label>
                    {isEditing ? (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-500/5 px-4 py-3 text-sm text-slate-300">
                          Selecciona una nueva foto para el perfil del Dueño.
                        </div>
                        <label className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white border border-white/10 cursor-pointer hover:bg-white/15 transition-colors">
                          Elegir archivo
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                    ) : null}
                    {photoFile ? (
                      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                        <img
                          src={photoPreview || ''}
                          alt="Vista previa"
                          className="h-14 w-14 rounded-xl object-cover border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{photoFile.name}</p>
                          <p className="text-xs text-cyan-300">La foto se guardará al presionar Guardar cambios</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/20 w-full"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar contacto
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex-1"
                        >
                          {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          {saving ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            setPhotoFile(null);
                            setEditForm({
                              email: owner?.email || user?.email || '',
                              phoneNumber: owner?.phoneNumber?.toString() || owner?.phone?.toString() || '',
                            });
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/60 backdrop-blur-sm shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Caballos del Dueño</h3>
                    <p className="text-sm text-slate-400">Raza, plan nutricional y box por caballo</p>
                  </div>
                </div>

                {horsesList.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-6 text-center text-slate-400">
                    No tienes caballos registrados
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[34rem] overflow-y-auto pr-1">
                    {horsesList.map((horse) => {
                      const summary = horseSummaries[horse.idHorse];
                      const raceName = summary?.raceName || horse.race?.nameRace || 'Sin especificar';
                      const planName = summary?.planName || 'Sin plan asignado';
                      const boxLabel = summary?.boxLabel || (horse.box ? 'Con box' : 'Sin box');
                      const boxActive = summary?.hasBox || Boolean(horse.box);

                      return (
                        <div
                          key={horse.idHorse}
                          className="group rounded-3xl border border-white/8 bg-slate-950/40 p-4 transition-all hover:border-cyan-400/25 hover:bg-slate-950/60"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <p className="text-lg font-semibold text-white">{horse.horseName}</p>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Caballo registrado</p>
                            </div>
                            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${boxActive ? 'bg-emerald-500/12 text-emerald-300 border border-emerald-400/20' : 'bg-slate-500/10 text-slate-300 border border-slate-400/10'}`}>
                              <BedDouble className="h-3.5 w-3.5" />
                              {boxLabel}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">Raza</p>
                              <p className="text-sm text-white">{raceName}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">Plan nutricional</p>
                              <p className="text-sm text-white">{planName}</p>
                              {summary?.planDescription ? (
                                <p className="text-xs text-cyan-300 mt-1">{summary.planDescription}</p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">Box</p>
                              <p className="text-sm text-white">{boxLabel}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">Estado</p>
                              <p className="text-sm text-emerald-300">Activo</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>

        
        </div>
      </div>
    </div>
  );
}
