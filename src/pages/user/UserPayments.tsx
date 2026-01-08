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
import { useCurrentUser, useOwnerData, useOwnerReports } from '../../hooks/useUserData';

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
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  // Usar hooks optimizados con React Query
  const { data: user } = useCurrentUser();
  const { data: ownerData, isLoading: ownerLoading } = useOwnerData(user?.id);
  const { data: reports = [], isLoading: reportsLoading } = useOwnerReports(ownerData?.idOwner);

  const loading = ownerLoading || reportsLoading;
  const totalControls = reports as TotalControl[];

  useEffect(() => {
    if (totalControls.length > 0) {
      calculateTotals();
    }
  }, [totalControls]);

  const calculateTotals = () => {
    const paid = totalControls
      .filter((r) => r.state === 'Pagado')
      .reduce((sum, r) => {
        const total = r.box + r.section + r.aBasket + r.contributionCabFlyer + 
                     r.VaccineApplication + r.deworming + r.AmeniaExam + 
                     r.externalTeacher + r.fine + r.saleChala + 
                     r.costPerBucket + r.healthCardPayment + r.other;
        return sum + total;
      }, 0);
    
    const pending = totalControls
      .filter((r) => r.state === 'Pendiente')
      .reduce((sum, r) => {
        const total = r.box + r.section + r.aBasket + r.contributionCabFlyer + 
                     r.VaccineApplication + r.deworming + r.AmeniaExam + 
                     r.externalTeacher + r.fine + r.saleChala + 
                     r.costPerBucket + r.healthCardPayment + r.other;
        return sum + total;
      }, 0);

    setTotalPaid(paid);
    setTotalPending(pending);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl m-6 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <UserHeader title="Mis Pagos y Estado Económico" />

        <div className="px-0 py-4 md:px-0 md:py-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/50 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative p-4 md:p-6">
              <div className="w-12 h-12 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/30 flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-amber-500/20">
                <DollarSign className="w-6 h-6 md:w-5 md:h-5 text-amber-400" />
              </div>
              <p className="text-xs text-slate-400 mb-2">Balance pendiente</p>
              <p className="text-3xl md:text-2xl text-white font-bold mb-1">${totalPending.toLocaleString()}</p>
              <p className="text-xs text-amber-400 font-medium">{totalPending === 0 ? 'Al día ✓' : 'Por pagar'}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/50 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative p-4 md:p-6">
              <div className="w-12 h-12 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-6 h-6 md:w-5 md:h-5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 mb-2">Total pagado</p>
              <p className="text-3xl md:text-2xl text-white font-bold mb-1">${totalPaid.toLocaleString()}</p>
              <p className="text-xs text-slate-400 font-medium">Histórico</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/50 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)] sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="relative p-4 md:p-6">
              <div className="w-12 h-12 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-cyan-600/30 flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-cyan-500/20">
                <Calendar className="w-6 h-6 md:w-5 md:h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-400 mb-2">Total registros</p>
              <p className="text-3xl md:text-2xl text-white font-bold mb-1">{totalControls.length}</p>
              <p className="text-xs text-cyan-400 font-medium">{totalControls.filter((c: any) => c.state === 'Pendiente').length} pendientes</p>
            </div>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-teal-400 mb-4 md:mb-6">Historial de Pagos</h3>
            
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
                    <div key={report.idOwnerReportMonth} className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/40 active:scale-[0.98] transition-transform shadow-md">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="text-base text-white font-semibold">{horsesCount} caballo(s)</p>
                            <span className="text-xs text-slate-500">•</span>
                            <p className="text-xs text-slate-400">
                              {new Date(report.period).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400">
                            📅 {new Date(report.paymentDate).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg text-white font-bold mb-2 whitespace-nowrap">${total.toFixed(2)}</p>
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${
                              report.state === 'Pagado'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : report.state === 'Anulado'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {report.state === 'Pagado' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {report.state}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                  })}
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

       
        </div>
      </div>
    </div>
  );
}
