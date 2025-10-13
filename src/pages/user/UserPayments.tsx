import { DollarSign, TrendingUp, Calendar, CheckCircle2, XCircle } from 'lucide-react';
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

interface PagosEstadoProps {}

export function UserPayments(_: PagosEstadoProps) {
  const payments = [
    {
      fecha: '05/10/2025',
      concepto: 'Mantenimiento mensual',
      monto: '$250',
      estado: 'Pagado'
    },
    {
      fecha: '01/09/2025',
      concepto: 'Veterinario',
      monto: '$150',
      estado: 'Pendiente'
    },
    {
      fecha: '15/08/2025',
      concepto: 'Alimentación premium',
      monto: '$180',
      estado: 'Pagado'
    },
    {
      fecha: '05/08/2025',
      concepto: 'Mantenimiento mensual',
      monto: '$250',
      estado: 'Pagado'
    }
  ];

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
              <p className="text-xs text-slate-500 mb-2">Balance actual</p>
              <p className="text-2xl text-white mb-1">$830</p>
              <p className="text-xs text-emerald-400">Al día</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="relative p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Total pagado</p>
              <p className="text-2xl text-white mb-1">$2,450</p>
              <p className="text-xs text-slate-400">Este año</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
            <div className="relative p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Próximo pago</p>
              <p className="text-2xl text-white mb-1">$150</p>
              <p className="text-xs text-cyan-400">15/11/2025</p>
            </div>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <h3 className="text-lg text-white mb-6">Historial de Pagos</h3>
            
            {/* Mobile View */}
            <div className="block md:hidden space-y-3">
              {payments.map((payment, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-white mb-1">{payment.concepto}</p>
                      <p className="text-xs text-slate-500">{payment.fecha}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white mb-1">{payment.monto}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          payment.estado === 'Pagado'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-cyan-500/10 text-cyan-400'
                        }`}
                      >
                        {payment.estado === 'Pagado' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {payment.estado}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                    <TableHead className="text-slate-400">Fecha</TableHead>
                    <TableHead className="text-slate-400">Concepto</TableHead>
                    <TableHead className="text-slate-400">Monto</TableHead>
                    <TableHead className="text-slate-400">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, index) => (
                    <TableRow key={index} className="border-slate-700/30 hover:bg-slate-800/30">
                      <TableCell className="text-slate-300">{payment.fecha}</TableCell>
                      <TableCell className="text-white">{payment.concepto}</TableCell>
                      <TableCell className="text-cyan-400">{payment.monto}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
                            payment.estado === 'Pagado'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-cyan-500/10 text-cyan-400'
                          }`}
                        >
                          {payment.estado === 'Pagado' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {payment.estado}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
