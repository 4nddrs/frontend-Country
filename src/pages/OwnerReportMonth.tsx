import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/owner_report_month/';

interface OwnerReportMonth {
  idOwnerReportMonth?: number;
  period: number;
  daysAlphaConsumption: number;
  quantityAlphaKg: number;
  priceAlpha: number;
  box: number;
  section: number;
  aBasket: number;
  contributionCabFlyer: number;
  VaccineApplication: number;
  deworming: number;
  AmeniaExam: number;
  externalTeacher: number;
  fine: number;
  saleChala: number;
  costPerBucket: number;
  healthCardPayment: number;
  other: number;
  fk_idOwner: number;
  created_at?: string;
}

const OwnerReportMonthManagement = () => {
  const [reports, setReports] = useState<OwnerReportMonth[]>([]);
  const [newReport, setNewReport] = useState<OwnerReportMonth>({
    period: 0,
    daysAlphaConsumption: 0,
    quantityAlphaKg: 0,
    priceAlpha: 0,
    box: 0,
    section: 0,
    aBasket: 0,
    contributionCabFlyer: 0,
    VaccineApplication: 0,
    deworming: 0,
    AmeniaExam: 0,
    externalTeacher: 0,
    fine: 0,
    saleChala: 0,
    costPerBucket: 0,
    healthCardPayment: 0,
    other: 0,
    fk_idOwner: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);


  const [owners, setOwners] = useState<any[]>([]);
  const fetchOwners = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/owner/");
      if (!res.ok) throw new Error("Error al obtener propietarios");
      const data = await res.json();
      setOwners(data);
    } catch {
      toast.error("No se pudieron cargar propietarios");
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener reportes');
      const data = await res.json();
      setReports(data);
    } catch {
      toast.error('No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchOwners();
  }, []);

  const createReport = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });
      if (!res.ok) throw new Error('Error al crear reporte');
      toast.success('Reporte creado!');
      setNewReport({
        period: 0,
        daysAlphaConsumption: 0,
        quantityAlphaKg: 0,
        priceAlpha: 0,
        box: 0,
        section: 0,
        aBasket: 0,
        contributionCabFlyer: 0,
        VaccineApplication: 0,
        deworming: 0,
        AmeniaExam: 0,
        externalTeacher: 0,
        fine: 0,
        saleChala: 0,
        costPerBucket: 0,
        healthCardPayment: 0,
        other: 0,
        fk_idOwner: 1,
      });
      fetchReports();
    } catch {
      toast.error('No se pudo crear el reporte.');
    }
  };

  const updateReport = async (id: number, updatedReport: OwnerReportMonth) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReport),
      });
      if (!res.ok) throw new Error('Error al actualizar reporte');
      toast.success('Reporte actualizado!');
      setEditingId(null);
      fetchReports();
    } catch {
      toast.error('No se pudo actualizar el reporte.');
    }
  };

  const deleteReport = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar reporte');
      toast.success('Reporte eliminado!');
      fetchReports();
    } catch {
      toast.error('No se pudo eliminar el reporte.');
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Reportes Mensuales de Propietario</h1>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
          <label htmlFor="period" className="block mb-1">Periodo</label>
          <input
            type="number"
            name="period"
            placeholder="Periodo"
            value={newReport.period}
            onChange={e => setNewReport({ ...newReport, period: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="daysAlphaConsumption" className="block mb-1">Días consumo alfalfa</label>
          <input
            type="number"
            name="daysAlphaConsumption"
            placeholder="Días consumo alfalfa"
            value={newReport.daysAlphaConsumption}
            onChange={e => setNewReport({ ...newReport, daysAlphaConsumption: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="quantityAlphaKg" className="block mb-1">Kg de alfalfa</label>
          <input
            type="number"
            name="quantityAlphaKg"
            placeholder="Kg de alfalfa"
            value={newReport.quantityAlphaKg}
            onChange={e => setNewReport({ ...newReport, quantityAlphaKg: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="priceAlpha" className="block mb-1">Precio alfalfa</label>
          <input
            type="number"
            name="priceAlpha"
            placeholder="Precio alfalfa"
            value={newReport.priceAlpha}
            onChange={e => setNewReport({ ...newReport, priceAlpha: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="box" className="block mb-1">Caja</label>
          <input
            type="number"
            name="box"
            placeholder="Caja"
            value={newReport.box}
            onChange={e => setNewReport({ ...newReport, box: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="section" className="block mb-1">Sección</label>
          <input
            type="number"
            name="section"
            placeholder="Sección"
            value={newReport.section}
            onChange={e => setNewReport({ ...newReport, section: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="aBasket" className="block mb-1">Canasta A</label>
          <input
            type="number"
            name="aBasket"
            placeholder="Canasta A"
            value={newReport.aBasket}
            onChange={e => setNewReport({ ...newReport, aBasket: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="contributionCabFlyer" className="block mb-1">Contribución Cab Fly</label>
          <input
            type="number"
            name="contributionCabFlyer"
            placeholder="Contribución Cab Fly"
            value={newReport.contributionCabFlyer}
            onChange={e => setNewReport({ ...newReport, contributionCabFlyer: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="VaccineApplication" className="block mb-1">Aplicación vacuna</label>
          <input
            type="number"
            name="VaccineApplication"
            placeholder="Aplicación vacuna"
            value={newReport.VaccineApplication}
            onChange={e => setNewReport({ ...newReport, VaccineApplication: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="deworming" className="block mb-1">Desparasitación</label>
          <input
            type="number"
            name="deworming"
            placeholder="Desparasitación"
            value={newReport.deworming}
            onChange={e => setNewReport({ ...newReport, deworming: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="AmeniaExam" className="block mb-1">Examen amenia</label>
          <input
            type="number"
            name="AmeniaExam"
            placeholder="Examen amenia"
            value={newReport.AmeniaExam}
            onChange={e => setNewReport({ ...newReport, AmeniaExam: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="externalTeacher" className="block mb-1">Docente externo</label>
          <input
            type="number"
            name="externalTeacher"
            placeholder="Docente externo"
            value={newReport.externalTeacher}
            onChange={e => setNewReport({ ...newReport, externalTeacher: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="fine" className="block mb-1">Multa</label>
          <input
            type="number"
            name="fine"
            placeholder="Multa"
            value={newReport.fine}
            onChange={e => setNewReport({ ...newReport, fine: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="saleChala" className="block mb-1">Venta chala</label>
          <input
            type="number"
            name="saleChala"
            placeholder="Venta chala"
            value={newReport.saleChala}
            onChange={e => setNewReport({ ...newReport, saleChala: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="costPerBucket" className="block mb-1">Costo por balde</label>
          <input
            type="number"
            name="costPerBucket"
            placeholder="Costo por balde"
            value={newReport.costPerBucket}
            onChange={e => setNewReport({ ...newReport, costPerBucket: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="healthCardPayment" className="block mb-1">Pago carnet de salud</label>
          <input
            type="number"
            name="healthCardPayment"
            placeholder="Pago carnet de salud"
            value={newReport.healthCardPayment}
            onChange={e => setNewReport({ ...newReport, healthCardPayment: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="other" className="block mb-1">Otro</label>
          <input
            type="number"
            name="other"
            placeholder="Otro"
            value={newReport.other}
            onChange={e => setNewReport({ ...newReport, other: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="fk_idOwner" className="block mb-1">Propietario</label>
          <select
            name="fk_idOwner"
            value={newReport.fk_idOwner}
            onChange={e => setNewReport({ ...newReport, fk_idOwner: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona propietario --</option>
            {owners.map(o => (<option key={o.idOwner} value={o.idOwner}>{o.name}</option>))}
          </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={createReport} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando reportes...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map(report => (
              <div key={report.idOwnerReportMonth} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === report.idOwnerReportMonth ? (
                  <>
                    <input
                      type="number"
                      defaultValue={report.period}
                      onChange={e => setNewReport({ ...newReport, period: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.daysAlphaConsumption}
                      onChange={e => setNewReport({ ...newReport, daysAlphaConsumption: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.quantityAlphaKg}
                      onChange={e => setNewReport({ ...newReport, quantityAlphaKg: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.priceAlpha}
                      onChange={e => setNewReport({ ...newReport, priceAlpha: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.box}
                      onChange={e => setNewReport({ ...newReport, box: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.section}
                      onChange={e => setNewReport({ ...newReport, section: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.aBasket}
                      onChange={e => setNewReport({ ...newReport, aBasket: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.contributionCabFlyer}
                      onChange={e => setNewReport({ ...newReport, contributionCabFlyer: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.VaccineApplication}
                      onChange={e => setNewReport({ ...newReport, VaccineApplication: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.deworming}
                      onChange={e => setNewReport({ ...newReport, deworming: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.AmeniaExam}
                      onChange={e => setNewReport({ ...newReport, AmeniaExam: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.externalTeacher}
                      onChange={e => setNewReport({ ...newReport, externalTeacher: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.fine}
                      onChange={e => setNewReport({ ...newReport, fine: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.saleChala}
                      onChange={e => setNewReport({ ...newReport, saleChala: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.costPerBucket}
                      onChange={e => setNewReport({ ...newReport, costPerBucket: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.healthCardPayment}
                      onChange={e => setNewReport({ ...newReport, healthCardPayment: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={report.other}
                      onChange={e => setNewReport({ ...newReport, other: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <select
                      value={newReport.fk_idOwner}
                      onChange={e => setNewReport({ ...newReport, fk_idOwner: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {owners.map(o => (<option key={o.idOwner} value={o.idOwner}>{o.name}</option>))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateReport(report.idOwnerReportMonth!, {
                          ...report,
                          ...newReport,
                        })}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Save size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">Reporte del periodo: {report.period}</h3>
                    <p>Días consumo alfalfa: {report.daysAlphaConsumption}</p>
                    <p>Kg de alfalfa: {report.quantityAlphaKg}</p>
                    <p>Precio alfalfa: {report.priceAlpha}</p>
                    <p>Caja: {report.box}</p>
                    <p>Sección: {report.section}</p>
                    <p>Canasta A: {report.aBasket}</p>
                    <p>Contribución Cab Fly: {report.contributionCabFlyer}</p>
                    <p>Aplicación vacuna: {report.VaccineApplication}</p>
                    <p>Desparasitación: {report.deworming}</p>
                    <p>Examen amenia: {report.AmeniaExam}</p>
                    <p>Docente externo: {report.externalTeacher}</p>
                    <p>Multa: {report.fine}</p>
                    <p>Venta chala: {report.saleChala}</p>
                    <p>Costo por balde: {report.costPerBucket}</p>
                    <p>Pago carnet de salud: {report.healthCardPayment}</p>
                    <p>Otro: {report.other}</p>
                    <p>Propietario: {owners.find(o => o.idOwner === report.fk_idOwner)?.name || report.fk_idOwner}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(report.idOwnerReportMonth!); setNewReport(report); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteReport(report.idOwnerReportMonth!)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerReportMonthManagement;