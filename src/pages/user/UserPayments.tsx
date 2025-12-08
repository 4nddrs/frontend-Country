import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CheckCircle2, XCircle, Loader } from 'lucide-react';
import { Card } from '../../components/ui/card';
import UserHeader from '../../components/UserHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

interface PagosEstadoProps {}

interface TotalControl {
  idOwnerReportMonth: number;
  period: string;
  state: string;
  paymentDate: string;
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
  horses_report: Array<{
    days: number;
    alphaKg: number;
    fk_idHorse: number;
    horse: any;
  }>;
  owner?: any;
}

export function UserPayments(_: PagosEstadoProps) {
  const [totalControls, setTotalControls] = useState<TotalControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No hay sesión activa');
        return;
      }

      // Get owner data - try query param or filter all owners
      let ownerData;
      const ownerRes = await fetch(`http://localhost:8000/owner/?uid=${user.id}`);
      
      if (ownerRes.status === 404 || !ownerRes.ok) {
        // Try getting all owners and filter by uid
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

      // Get owner reports (payment data)
      console.log('📊 Buscando reportes de pago para owner ID:', ownerData.idOwner);
      const reportsRes = await fetch(`http://localhost:8000/owner_report_month/`);
      
      if (!reportsRes.ok) {
        console.log('❌ Error en respuesta:', reportsRes.status, reportsRes.statusText);
        throw new Error('Error al obtener datos de pago');
      }
      
      const allReports = await reportsRes.json();
      console.log('📦 Total de reportes:', allReports.length);
      
      // Filter by owner ID
      const ownerReports = allReports.filter((r: any) => r.fk_idOwner === ownerData.idOwner);
      console.log('✅ Reportes filtrados para este owner:', ownerReports.length);
      
      setTotalControls(ownerReports);

      // Calculate totals
      const paid = ownerReports
        .filter((r: any) => r.state === 'Pagado')
        .reduce((sum: number, r: any) => {
          const total = r.box + r.section + r.aBasket + r.contributionCabFlyer + 
                       r.VaccineApplication + r.deworming + r.AmeniaExam + 
                       r.externalTeacher + r.fine + r.saleChala + 
                       r.costPerBucket + r.healthCardPayment + r.other;
          return sum + total;
        }, 0);
      
      const pending = ownerReports
        .filter((r: any) => r.state === 'Pendiente')
        .reduce((sum: number, r: any) => {
          const total = r.box + r.section + r.aBasket + r.contributionCabFlyer + 
                       r.VaccineApplication + r.deworming + r.AmeniaExam + 
                       r.externalTeacher + r.fine + r.saleChala + 
                       r.costPerBucket + r.healthCardPayment + r.other;
          return sum + total;
        }, 0);

      setTotalPaid(paid);
      setTotalPending(pending);
      
    } catch (error: any) {
      console.error('Error fetching payment data:', error);
      toast.error('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Mis Pagos y Estado Económico" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
            <div className="relative p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Balance pendiente</p>
              <p className="text-2xl text-white mb-1">${totalPending.toLocaleString()}</p>
              <p className="text-xs text-amber-400">{totalPending === 0 ? 'Al día' : 'Por pagar'}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="relative p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Total pagado</p>
              <p className="text-2xl text-white mb-1">${totalPaid.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Histórico</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
            <div className="relative p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Total registros</p>
              <p className="text-2xl text-white mb-1">{totalControls.length}</p>
              <p className="text-xs text-cyan-400">{totalControls.filter((c: any) => c.state === 'Pendiente').length} pendientes</p>
            </div>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <h3 className="text-lg text-white mb-6">Historial de Pagos</h3>
            
            {totalControls.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No hay registros de pagos
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block md:hidden space-y-3">
                  {totalControls.map((report: any) => {
                    const total = report.box + report.section + report.aBasket + report.contributionCabFlyer + 
                                 report.VaccineApplication + report.deworming + report.AmeniaExam + 
                                 report.externalTeacher + report.fine + report.saleChala + 
                                 report.costPerBucket + report.healthCardPayment + report.other;
                    const horsesCount = report.horses_report?.length || 0;
                    return (
                    <div key={report.idOwnerReportMonth} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm text-white mb-1">{horsesCount} caballo(s)</p>
                          <p className="text-xs text-slate-500">
                            {new Date(report.period).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">Fecha pago: {new Date(report.paymentDate).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white mb-1">${total.toFixed(2)}</p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              report.state === 'Pagado'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : report.state === 'Anulado'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {report.state === 'Pagado' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {report.state}
                          </span>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-transparent">
                        <TableHead className="text-slate-400">Período</TableHead>
                        <TableHead className="text-slate-400">Caballos</TableHead>
                        <TableHead className="text-slate-400">Fecha Pago</TableHead>
                        <TableHead className="text-slate-400">Monto Total</TableHead>
                        <TableHead className="text-slate-400">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {totalControls.map((report: any) => {
                        const total = report.box + report.section + report.aBasket + report.contributionCabFlyer + 
                                     report.VaccineApplication + report.deworming + report.AmeniaExam + 
                                     report.externalTeacher + report.fine + report.saleChala + 
                                     report.costPerBucket + report.healthCardPayment + report.other;
                        const horsesCount = report.horses_report?.length || 0;
                        return (
                        <TableRow key={report.idOwnerReportMonth} className="border-slate-700/30 hover:bg-slate-800/30">
                          <TableCell className="text-slate-300">
                            {new Date(report.period).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-white">{horsesCount} caballo(s)</TableCell>
                          <TableCell className="text-slate-300">{new Date(report.paymentDate).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell className="text-cyan-400">${total.toFixed(2)}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
                                report.state === 'Pagado'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : report.state === 'Anulado'
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {report.state === 'Pagado' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {report.state}
                            </span>
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-4 md:p-6">
            <h3 className="text-sm text-slate-400 mb-4">Métodos de pago aceptados</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                <p className="text-xs text-slate-300">Tarjeta de crédito</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                <p className="text-xs text-slate-300">Transferencia</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                <p className="text-xs text-slate-300">Efectivo</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                <p className="text-xs text-slate-300">Cheque</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
