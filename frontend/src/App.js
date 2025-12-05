import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Activity, AlertTriangle, Globe, Search, CheckCircle, XCircle, Database, Lock, Menu, Settings, Save, Key
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// --- COMPONENTS ---

const StatusBadge = ({ status }) => {
  const isOk = status === 'connected';
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isOk ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
      {isOk ? <CheckCircle size={12} /> : <XCircle size={12} />}
      <span className="uppercase">{status}</span>
    </div>
  );
};

const IntegrationCard = ({ name, type, status, icon: Icon }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between shadow-lg">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-700 rounded-lg">
        <Icon size={24} className="text-blue-400" />
      </div>
      <div>
        <h3 className="font-bold text-slate-100">{name}</h3>
        <p className="text-xs text-slate-400">{type}</p>
      </div>
    </div>
    <StatusBadge status={status} />
  </div>
);

const SeverityPill = ({ level }) => {
  const colors = {
    Critical: 'bg-red-500/20 text-red-400 border-red-900',
    High: 'bg-orange-500/20 text-orange-400 border-orange-900',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-900',
    Low: 'bg-blue-500/20 text-blue-400 border-blue-900',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold border ${colors[level] || colors.Low}`}>
      {level}
    </span>
  );
};

// Componente de Configuração de API
const ApiConfigForm = ({ title, icon: Icon, fields, onSave, savedData }) => {
  const [formData, setFormData] = useState(savedData || {});
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
        <div className="p-2 bg-slate-700 rounded-lg">
          <Icon className="text-blue-400" size={20} />
        </div>
        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        {isSaved && <span className="ml-auto text-emerald-400 text-sm flex items-center gap-1"><CheckCircle size={14}/> Salvo</span>}
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{field.label}</label>
            <div className="relative">
              <input
                type={field.type || 'text'}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
              {field.type === 'password' && <Key size={14} className="absolute right-3 top-3 text-slate-600" />}
            </div>
          </div>
        ))}
        <div className="md:col-span-2 flex justify-end mt-2">
          <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold transition-colors">
            <Save size={16} /> Salvar Configuração
          </button>
        </div>
      </form>
    </div>
  );
};

export default function SOCDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    elastic: [],
    defender: [],
    tenable: [],
    openCTI: [],
    correlated: []
  });
  const [apiConfigs, setApiConfigs] = useState({});
  const [loading, setLoading] = useState(true);

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfigs = localStorage.getItem('soc_api_configs');
    if (savedConfigs) {
      setApiConfigs(JSON.parse(savedConfigs));
    }
  }, []);

  const handleSaveConfig = (service, config) => {
    const newConfigs = { ...apiConfigs, [service]: config };
    setApiConfigs(newConfigs);
    localStorage.setItem('soc_api_configs', JSON.stringify(newConfigs));
  };

  // Fetching de Dados do Backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Tenta conectar ao Backend
        const response = await fetch('http://localhost:8000/api/dashboard');
        if (response.ok) {
           const result = await response.json();
           setData(result);
        } else {
           console.error("Backend offline, using fallback state");
        }
      } catch (error) {
        console.error("Connection error:", error);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    return [
      { name: 'Elastic SIEM', alerts: data.elastic.length },
      { name: 'MS Defender', alerts: data.defender.length },
      { name: 'Correlated', alerts: data.correlated.length },
    ];
  }, [data]);

  const severityData = [
    { name: 'Critical', value: data.correlated.filter(i => i.severity === 'Critical').length, color: '#ef4444' },
    { name: 'High', value: data.correlated.filter(i => i.severity === 'High').length, color: '#f97316' },
    { name: 'Medium', value: 2, color: '#eab308' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <Shield className="text-blue-500" size={32} />
          <h1 className="text-xl font-bold tracking-tighter">SOC<span className="text-blue-500">NEXUS</span></h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <Activity size={20} />
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('incidents')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'incidents' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <AlertTriangle size={20} />
            Incidentes
            {data.correlated.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{data.correlated.length}</span>}
          </button>
          <div className="pt-4 mt-4 border-t border-slate-800">
             <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
            >
              <Settings size={20} />
              Configurações
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-900 relative">
        <header className="md:hidden bg-slate-950 p-4 flex justify-between items-center border-b border-slate-800">
          <Shield className="text-blue-500" />
          <Menu className="text-slate-400" />
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <IntegrationCard name="Elastic SIEM" type="Log & Events" status="connected" icon={Database} />
                <IntegrationCard name="MS Defender" type="EDR / XDR" status="connected" icon={Shield} />
                <IntegrationCard name="Tenable.io" type="Vuln Mgmt" status="connected" icon={Search} />
                <IntegrationCard name="OpenCTI" type="Threat Intel" status="connected" icon={Globe} />
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
                  <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-blue-500" />
                    Volume de Alertas
                  </h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} cursor={{ fill: '#334155', opacity: 0.4 }}/>
                        <Bar dataKey="alerts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
                  <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-500" />
                    Severidade
                  </h2>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={severityData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {severityData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    Incidentes Críticos
                  </h2>
                  <button onClick={() => setActiveTab('incidents')} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">Ver Todos</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 uppercase text-xs font-bold text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Severidade</th>
                        <th className="px-6 py-4">Evento Principal</th>
                        <th className="px-6 py-4">Ativo Alvo</th>
                        <th className="px-6 py-4">Contexto</th>
                        <th className="px-6 py-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {data.correlated.map((incident) => (
                        <tr key={incident.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4"><SeverityPill level={incident.severity} /></td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-200">{incident.primary_alert}</div>
                            <div className="text-xs text-slate-500">{incident.source}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-300">{incident.target}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 text-xs">
                              {incident.context.vuln !== 'N/A' && <span className="text-orange-400 flex items-center gap-1"><Lock size={10} /> {incident.context.vuln}</span>}
                              {incident.context.intel !== 'N/A' && <span className="text-purple-400 flex items-center gap-1"><Globe size={10} /> {incident.context.intel}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-slate-100 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-xs font-medium transition-colors">Investigar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Settings / Admin Panel View */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Painel de Administração</h2>
              <p className="text-slate-400 mb-8">Gerencie as conexões API e integrações do SOC.</p>

              <ApiConfigForm 
                title="Elastic SIEM" 
                icon={Database}
                savedData={apiConfigs.elastic}
                onSave={(data) => handleSaveConfig('elastic', data)}
                fields={[
                  { name: 'url', label: 'Elasticsearch URL', placeholder: 'https://seu-elastic:9200', fullWidth: true },
                  { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API Key' },
                  { name: 'indexPattern', label: 'Index Pattern', placeholder: 'logs-*' }
                ]}
              />

              <ApiConfigForm 
                title="Microsoft Defender for Endpoint" 
                icon={Shield}
                savedData={apiConfigs.defender}
                onSave={(data) => handleSaveConfig('defender', data)}
                fields={[
                  { name: 'tenantId', label: 'Tenant ID', placeholder: 'Azure Tenant ID' },
                  { name: 'clientId', label: 'Client ID', placeholder: 'Application ID' },
                  { name: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Value', fullWidth: true }
                ]}
              />

              <ApiConfigForm 
                title="Tenable.io" 
                icon={Search}
                savedData={apiConfigs.tenable}
                onSave={(data) => handleSaveConfig('tenable', data)}
                fields={[
                  { name: 'accessKey', label: 'Access Key', type: 'password', placeholder: 'Tenable Access Key' },
                  { name: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Tenable Secret Key' }
                ]}
              />

              <ApiConfigForm 
                title="OpenCTI" 
                icon={Globe}
                savedData={apiConfigs.opencti}
                onSave={(data) => handleSaveConfig('opencti', data)}
                fields={[
                  { name: 'url', label: 'OpenCTI URL', placeholder: 'https://demo.opencti.io', fullWidth: true },
                  { name: 'token', label: 'Auth Token', type: 'password', placeholder: 'Bearer Token', fullWidth: true }
                ]}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
