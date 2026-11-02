import React, { useState } from 'react';
import { 
  Cloud, 
  FolderSync, 
  CheckCircle2, 
  AlertCircle, 
  Folder, 
  FileSpreadsheet, 
  FileText, 
  Image, 
  FileCode, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Settings, 
  Check, 
  Copy,
  ChevronRight,
  Shield,
  UploadCloud,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Quote, Project, OneDriveConfig, OneDriveFolderMapping, OneDriveFileItem } from '../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeQuote?: Quote;
  activeProject?: Project;
  onSyncQuote?: (quote: Quote) => void;
}

export const OneDriveSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeQuote,
  activeProject,
  onSyncQuote
}) => {
  const [activeTab, setActiveTab] = useState<'folders' | 'files' | 'oauth'>('folders');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Microsoft OneDrive Connection State
  const [isConnected, setIsConnected] = useState(true);
  const [accountEmail, setAccountEmail] = useState('mkuhtze@archtech.co.nz');
  const [tenantName, setTenantName] = useState('Archtech Architectural Roofing Limited (Microsoft 365 Business)');
  const [rootFolder, setRootFolder] = useState('/OneDrive - Archtech Roofing Ltd');

  // Dedicated Folder Mappings
  const [mappings, setMappings] = useState<OneDriveFolderMapping[]>([
    {
      category: 'Quotes',
      title: 'Architectural Quotes & Excel Takeoffs',
      folderPattern: '/Projects/{JobNumber} - {ClientName}/Quotes & Spreadsheets/',
      autoSync: true,
      syncedFilesCount: 8,
      lastSyncedAt: 'Just now'
    },
    {
      category: 'Drawings',
      title: 'Architectural Plans & CAD/PDF Sheets',
      folderPattern: '/Projects/{JobNumber} - {ClientName}/Architectural Plans/',
      autoSync: true,
      syncedFilesCount: 4,
      lastSyncedAt: '2 hours ago'
    },
    {
      category: 'SitePhotos',
      title: 'Site Inspection Photos & QA Audits',
      folderPattern: '/Projects/{JobNumber} - {ClientName}/Site QA Photos/',
      autoSync: true,
      syncedFilesCount: 16,
      lastSyncedAt: 'Yesterday'
    },
    {
      category: 'Compliance',
      title: 'Producer Statement PS3 & Council CCC',
      folderPattern: '/Projects/{JobNumber} - {ClientName}/Compliance & PS3/',
      autoSync: true,
      syncedFilesCount: 2,
      lastSyncedAt: '3 days ago'
    },
    {
      category: 'SupplierOrders',
      title: 'The Roofing Store Coil & Flashing Purchase Orders',
      folderPattern: '/Suppliers/The Roofing Store/Purchase Orders/',
      autoSync: false,
      syncedFilesCount: 12,
      lastSyncedAt: '5 days ago'
    }
  ]);

  // Synced files for current project / quote
  const jobNum = activeProject?.projectNumber || activeQuote?.quoteNumber || 'ARCH-Q-2026-092';
  const client = activeProject?.clientName || activeQuote?.clientName || 'Julian & Sarah Vance';

  const [files, setFiles] = useState<OneDriveFileItem[]>([
    {
      id: 'f-1',
      fileName: `${jobNum}_Archtech_Takeoff_Matrix.xlsx`,
      folderPath: `${rootFolder}/Projects/${jobNum} - ${client}/Quotes & Spreadsheets/`,
      category: 'Quotes',
      fileSizeBytes: 148200,
      extension: 'xlsx',
      uploadedAt: new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }),
      webUrl: 'https://onedrive.live.com',
      status: 'synced'
    },
    {
      id: 'f-2',
      fileName: `${jobNum}_Interactive_Proposal_RevA.pdf`,
      folderPath: `${rootFolder}/Projects/${jobNum} - ${client}/Quotes & Spreadsheets/`,
      category: 'Quotes',
      fileSizeBytes: 2450000,
      extension: 'pdf',
      uploadedAt: new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }),
      webUrl: 'https://onedrive.live.com',
      status: 'synced'
    },
    {
      id: 'f-3',
      fileName: `${jobNum}_FearonHay_RoofPlan_A201_RevD.pdf`,
      folderPath: `${rootFolder}/Projects/${jobNum} - ${client}/Architectural Plans/`,
      category: 'Drawings',
      fileSizeBytes: 5820000,
      extension: 'pdf',
      uploadedAt: 'Today 09:30 AM',
      webUrl: 'https://onedrive.live.com',
      status: 'synced'
    },
    {
      id: 'f-4',
      fileName: `${jobNum}_Substrate_Moisture_14pct.jpg`,
      folderPath: `${rootFolder}/Projects/${jobNum} - ${client}/Site QA Photos/`,
      category: 'SitePhotos',
      fileSizeBytes: 3410000,
      extension: 'jpg',
      uploadedAt: 'Yesterday 14:15',
      webUrl: 'https://onedrive.live.com',
      status: 'synced'
    }
  ]);

  if (!isOpen) return null;

  const handleSyncActiveQuote = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccessToast(true);
      const newXlsx: OneDriveFileItem = {
        id: `f-${Date.now()}`,
        fileName: `${jobNum}_Takeoff_Live_Matrix_${new Date().toISOString().slice(0, 10)}.xlsx`,
        folderPath: `${rootFolder}/Projects/${jobNum} - ${client}/Quotes & Spreadsheets/`,
        category: 'Quotes',
        fileSizeBytes: 162400,
        extension: 'xlsx',
        uploadedAt: 'Just now',
        webUrl: 'https://onedrive.live.com',
        status: 'synced'
      };
      setFiles(prev => [newXlsx, ...prev]);
      if (activeQuote && onSyncQuote) {
        onSyncQuote({
          ...activeQuote,
          oneDriveSyncStatus: 'synced',
          oneDriveFolderUrl: `${rootFolder}/Projects/${jobNum} - ${client}/Quotes & Spreadsheets/`
        });
      }
      setTimeout(() => setSyncSuccessToast(false), 4000);
    }, 1200);
  };

  const handleToggleAutoSync = (category: string) => {
    setMappings(prev => prev.map(m => m.category === category ? { ...m, autoSync: !m.autoSync } : m));
  };

  const callbackUrl = `${window.location.origin}/auth/callback`;

  const copyCallbackToClipboard = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col text-xs max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Microsoft OneDrive Cloud Sync</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ● Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Automated folder routing for Archtech architectural takeoffs, plans, and photos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('folders')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'folders'
                ? 'border-sky-600 text-sky-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-sky-600" />
            <span>Dedicated Folder Routing ({mappings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-sky-600 text-sky-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Synced Cloud Files ({files.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'border-sky-600 text-sky-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Account & Microsoft OAuth</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {syncSuccessToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-emerald-900 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Successfully synced current quote takeoff to OneDrive folder!</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700">File uploaded</span>
            </div>
          )}

          {/* TAB 1: DEDICATED FOLDER ROUTING */}
          {activeTab === 'folders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-sky-50/70 p-3 rounded-lg border border-sky-200">
                <div>
                  <span className="text-[10px] font-mono text-sky-700 uppercase tracking-wider block">Target OneDrive Root</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{rootFolder}</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Job tokens like <code className="bg-white px-1 py-0.5 rounded border border-sky-200 text-sky-800 font-bold">&#123;JobNumber&#125;</code> and <code className="bg-white px-1 py-0.5 rounded border border-sky-200 text-sky-800 font-bold">&#123;ClientName&#125;</code> are dynamically resolved.
                  </p>
                </div>
                <button
                  onClick={handleSyncActiveQuote}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Active Quote Now'}</span>
                </button>
              </div>

              {/* Dedicated Mappings List */}
              <div className="space-y-2.5">
                {mappings.map(map => (
                  <div key={map.category} className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-sky-600" />
                        <h4 className="font-bold text-slate-900">{map.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {map.syncedFilesCount} files · {map.lastSyncedAt}
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                          <input
                            type="checkbox"
                            checked={map.autoSync}
                            onChange={() => handleToggleAutoSync(map.category)}
                            className="rounded border-slate-300 text-sky-600"
                          />
                          <span>Auto-Sync</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between font-mono text-[11px] text-slate-700">
                      <span className="truncate">{map.folderPattern.replace('{JobNumber}', jobNum).replace('{ClientName}', client)}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">Dedicated Path</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SYNCED CLOUD FILES */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Cloud Files for Job: <strong className="text-slate-900">{jobNum} ({client})</strong>
                </span>
                <button
                  onClick={handleSyncActiveQuote}
                  disabled={isSyncing}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Latest Excel</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
                {files.map(file => (
                  <div key={file.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {file.extension === 'xlsx' ? (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : file.extension === 'pdf' ? (
                        <FileText className="w-5 h-5 text-rose-600 shrink-0" />
                      ) : (
                        <Image className="w-5 h-5 text-sky-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{file.fileName}</span>
                        <span className="text-[11px] text-slate-500 font-mono block truncate">{file.folderPath}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div className="font-mono text-[10px] text-slate-400">
                        <span>{(file.fileSizeBytes / 1024).toFixed(0)} KB</span>
                        <span className="block text-emerald-700 font-semibold">{file.uploadedAt}</span>
                      </div>
                      <a
                        href="https://onedrive.live.com"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        title="View in OneDrive Web"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: OAUTH & ACCOUNT SETTINGS */}
          {activeTab === 'oauth' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Microsoft 365 / Azure AD Credentials</h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    Active Session
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Authenticated Account</label>
                    <input
                      type="email"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded font-medium bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Organization / Tenant</label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded font-medium bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">OAuth 2.0 Redirect URI</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={callbackUrl}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono text-[11px] bg-slate-100 text-slate-700 select-all"
                    />
                    <button
                      onClick={copyCallbackToClipboard}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Add this exact redirect URI into your Microsoft Azure Portal App Registration under Authentication &gt; Web Redirect URIs.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <strong>Graph API Scopes Granted:</strong>
                <p className="font-mono text-[10px] text-slate-700">
                  Files.ReadWrite, Files.ReadWrite.All, Sites.ReadWrite.All, User.Read
                </p>
                <p className="text-slate-600 mt-1">
                  Enables Archtech CRM to automatically create project folders, stream Excel takeoffs, and store signed client proposals directly in your company OneDrive.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Cloud className="w-4 h-4 text-sky-600" />
            <span>Folder structure synced for <strong>{jobNum}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
