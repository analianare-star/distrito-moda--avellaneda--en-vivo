import React, { useState } from 'react';
import { Button } from './Button';
import { api } from '../services/api';
import { Shop, Stream, UserContext } from '../types';
import { User, Clock, AlertTriangle, RefreshCw, ShoppingCart, Lock } from 'lucide-react';

interface TestPanelProps {
    streams: Stream[];
    shops: Shop[];
    onRefreshData: () => void;
    onUserLogin: (user: UserContext) => void;
}

export const TestPanel: React.FC<TestPanelProps> = ({ streams, shops, onRefreshData, onUserLogin }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedStreamId, setSelectedStreamId] = useState<string>('');
    const [timeOffset, setTimeOffset] = useState<string>('5'); // Default 5 mins (start of report window)
    const [selectedShopId, setSelectedShopId] = useState<string>('');

    const handleLogin = async () => {
        if (!selectedUserId) {
            // Anonymous
            onUserLogin({
                isLoggedIn: false,
                favorites: [],
                reminders: [],
                reports: []
            });
            alert('Modo: Cliente Anónimo');
            return;
        }

        const user = await api.loginUser(`usuario_${selectedUserId}@test.com`, selectedUserId);
        onUserLogin(user);
        alert(`Logueado como: ${user.name} (ID: ${user.id})`);
    };

    const handleTimeTravel = async () => {
        if (!selectedStreamId) return alert('Selecciona un vivo');
        await api.updateStreamTime(selectedStreamId, parseInt(timeOffset));
        onRefreshData();
        alert(`Vivo actualizado a H0 + ${timeOffset} minutos (Relativo a AHORA).`);
    };

    const handleReset = async () => {
        if (confirm('¿Resetear toda la base de datos de prueba? Se perderán reportes y penalizaciones.')) {
            await api.resetSystem();
            onRefreshData();
            alert('Sistema reseteado.');
        }
    };

    const handleBuyQuota = async () => {
        if (!selectedShopId) return alert('Selecciona una tienda');
        await api.buyQuota(selectedShopId, 1);
        onRefreshData();
        alert('Cupo comprado simulado.');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="font-serif text-2xl text-dm-dark flex items-center gap-2">
                <AlertTriangle className="text-dm-crimson" /> Panel de Pruebas & Simulaciones
            </h2>
            <p className="text-gray-500 -mt-6">Herramientas para QA y demostración de lógica de negocio.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. SIMULADOR DE USUARIO */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-dm-dark mb-4 flex items-center gap-2">
                        <User size={18}/> Simulador de Identidad
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Seleccionar Rol / ID</label>
                            <select 
                                value={selectedUserId} 
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full p-2 border rounded bg-gray-50"
                            >
                                <option value="">Cliente Anónimo (No Logueado)</option>
                                <option value="C1">Cliente C1 (Normal)</option>
                                <option value="C2">Cliente C2 (Normal)</option>
                                <option value="C3">Cliente C3 (Normal)</option>
                                <option value="C4">Cliente C4 (Para completar Reporte #4)</option>
                            </select>
                        </div>
                        <Button onClick={handleLogin} className="w-full">
                            Aplicar Identidad
                        </Button>
                    </div>
                </div>

                {/* 2. CONTROL DE TIEMPO (REPORT WINDOW) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-dm-dark mb-4 flex items-center gap-2">
                        <Clock size={18}/> Máquina del Tiempo (Vivos)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Vivo Objetivo</label>
                            <select 
                                value={selectedStreamId} 
                                onChange={(e) => setSelectedStreamId(e.target.value)}
                                className="w-full p-2 border rounded bg-gray-50 text-sm"
                            >
                                <option value="">Seleccionar vivo...</option>
                                {streams.map(s => (
                                    <option key={s.id} value={s.id}>{s.shop.name} - {s.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Desplazar Horario (Minutos desde AHORA)</label>
                            <div className="flex gap-2">
                                <select 
                                    value={timeOffset} 
                                    onChange={(e) => setTimeOffset(e.target.value)}
                                    className="w-full p-2 border rounded bg-gray-50"
                                >
                                    <option value="-60">Hace 1 hora (Finalizado)</option>
                                    <option value="0">AHORA (Comienzo)</option>
                                    <option value="10">En 10 min (Ventana Reporte Activa)</option>
                                    <option value="40">En 40 min (Ventana Reporte Cerrada)</option>
                                    <option value="120">En 2 horas (Futuro)</option>
                                </select>
                                <Button size="sm" variant="outline" onClick={handleTimeTravel}>Aplicar</Button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Usa "En 10 min" para probar el botón "Reportar" si el vivo no inicia.</p>
                        </div>
                    </div>
                </div>

                {/* 3. SIMULADOR DE COMPRAS */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-dm-dark mb-4 flex items-center gap-2">
                        <ShoppingCart size={18}/> Simulador de Compras
                    </h3>
                    <div className="space-y-4">
                        <select 
                            value={selectedShopId} 
                            onChange={(e) => setSelectedShopId(e.target.value)}
                            className="w-full p-2 border rounded bg-gray-50 text-sm"
                        >
                            <option value="">Seleccionar tienda...</option>
                            {shops.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (Plan: {s.plan})</option>
                            ))}
                        </select>
                        <Button onClick={handleBuyQuota} className="w-full bg-green-600 hover:bg-green-700 border-none text-white">
                            Simular Pago de 1 Cupo
                        </Button>
                    </div>
                </div>

                {/* 4. ZONA DE PELIGRO */}
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                            <Lock size={18}/> Hard Reset
                        </h3>
                        <p className="text-xs text-red-600 mb-4">
                            Restaura las tiendas y vivos a su estado original. Elimina reportes, penalizaciones y cupos extra comprados.
                        </p>
                    </div>
                    <Button onClick={handleReset} variant="primary" className="w-full bg-red-600 hover:bg-red-700 border-none">
                        <RefreshCw size={16} className="mr-2"/> Resetear Sistema
                    </Button>
                </div>

            </div>
        </div>
    );
};