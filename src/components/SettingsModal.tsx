"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  Server,
  User,
  Key,
  ShieldCheck,
  Calendar,
  RotateCcw,
  Check,
  AlertCircle,
  Wifi,
  Trash2,
} from "lucide-react";
import { AuthResponse } from "@/types/iptv";
import { fetchAuth, DEFAULT_CONFIG } from "@/services/iptv";
import {
  getStoredCredentials,
  saveStoredCredentials,
  clearStoredCredentials,
} from "@/services/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onReload }) => {
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [server, setServer] = useState(DEFAULT_CONFIG.server);
  const [username, setUsername] = useState(DEFAULT_CONFIG.username);
  const [password, setPassword] = useState(DEFAULT_CONFIG.password);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const stored = getStoredCredentials();
    if (stored) {
      setServer(stored.server);
      setUsername(stored.username);
      setPassword(stored.password);
    } else {
      setServer(DEFAULT_CONFIG.server);
      setUsername(DEFAULT_CONFIG.username);
      setPassword(DEFAULT_CONFIG.password);
    }

    setLoadingAuth(true);
    fetchAuth()
      .then((data) => {
        setAuthData(data);
      })
      .catch((err) => {
        console.error("Auth check failed", err);
      })
      .finally(() => setLoadingAuth(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredCredentials({ server: server.trim(), username: username.trim(), password: password.trim() });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    onReload();
  };

  const handleReset = () => {
    clearStoredCredentials();
    setServer(DEFAULT_CONFIG.server);
    setUsername(DEFAULT_CONFIG.username);
    setPassword(DEFAULT_CONFIG.password);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    onReload();
  };

  const handleTestConnection = async () => {
    setLoadingAuth(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const data = await fetchAuth();
      const elapsed = Date.now() - start;
      setAuthData(data);
      setTestResult(`Conexão bem sucedida (${elapsed}ms). Status: ${data.user_info.status}`);
    } catch (e: any) {
      setTestResult(`Falha na conexão: ${e.message}`);
    } finally {
      setLoadingAuth(false);
    }
  };

  const expDateString = authData?.user_info?.exp_date
    ? new Date(Number(authData.user_info.exp_date) * 1000).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Ilimitado / Não especificado";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#12141c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Configurações & Conta</h2>
              <p className="text-xs text-gray-400">Detalhes da assinatura e conexão IPTV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server & Subscription Card */}
        <div className="bg-surface-light/60 border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Status da Assinatura
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {authData?.user_info?.status === "Active" ? "Ativa" : authData?.user_info?.status || "Online"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div>
              <span className="text-gray-500 block">Usuário</span>
              <span className="font-mono text-gray-200 font-semibold">{authData?.user_info?.username || username}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Validade</span>
              <span className="text-gray-200 font-semibold">{expDateString}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Conexões Simultâneas</span>
              <span className="text-gray-200 font-semibold">
                {authData?.user_info?.active_cons || 0} / {authData?.user_info?.max_connections || 1}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Formatos Suportados</span>
              <span className="text-gray-200 font-semibold">HLS (.m3u8), TS, MP4</span>
            </div>
          </div>

          {testResult && (
            <div className={`p-2.5 rounded-lg text-xs mt-2 ${
              testResult.includes("sucedida")
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}>
              {testResult}
            </div>
          )}
        </div>

        {/* Editable Server Credentials */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Credenciais do Servidor Xtream / M3U
          </h3>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-red-500" />
              <span>URL do Servidor</span>
            </label>
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-light border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-500" />
                <span>Usuário</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-light border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-red-500" />
                <span>Senha</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-light border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={loadingAuth}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-light hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition-colors"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>{loadingAuth ? "Testando..." : "Testar Conexão"}</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-light hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
              title="Restaurar credenciais padrão da lista fornecida"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Padrão</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all"
            >
              {isSaved ? <Check className="w-4 h-4" /> : null}
              <span>{isSaved ? "Salvo com Sucesso!" : "Salvar"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
