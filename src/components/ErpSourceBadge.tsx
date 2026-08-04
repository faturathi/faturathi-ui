import React from 'react';
import { Database, Cloud, Layers, FileSpreadsheet, Box, Code, Upload, RefreshCw, PenTool, ArrowLeftRight, Cpu } from 'lucide-react';
import { ErpSystem, SourceChannel } from '../types';

interface ErpSourceBadgeProps {
  erpSystem?: ErpSystem | string;
  sourceChannel?: SourceChannel | string;
  compact?: boolean;
}

export const ErpSourceBadge: React.FC<ErpSourceBadgeProps> = ({
  erpSystem = 'SAP S/4HANA',
  sourceChannel = 'REST API',
  compact = false
}) => {
  const getErpIcon = (erp: string) => {
    switch (erp) {
      case 'SAP S/4HANA':
        return <Database className="h-3 w-3 text-blue-600 shrink-0" />;
      case 'Oracle Cloud ERP':
        return <Cloud className="h-3 w-3 text-red-600 shrink-0" />;
      case 'Microsoft Dynamics 365':
        return <Layers className="h-3 w-3 text-indigo-600 shrink-0" />;
      case 'Tally Prime':
        return <FileSpreadsheet className="h-3 w-3 text-emerald-600 shrink-0" />;
      case 'Odoo ERP':
        return <Box className="h-3 w-3 text-purple-600 shrink-0" />;
      default:
        return <Cpu className="h-3 w-3 text-slate-600 shrink-0" />;
    }
  };

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'REST API':
        return <Code className="h-3 w-3 text-blue-600 shrink-0" />;
      case 'File Upload':
        return <Upload className="h-3 w-3 text-emerald-600 shrink-0" />;
      case 'SFTP Sync':
      case 'SFTP':
        return <ArrowLeftRight className="h-3 w-3 text-purple-600 shrink-0" />;
      case 'Manual Entry':
        return <PenTool className="h-3 w-3 text-amber-600 shrink-0" />;
      case 'ERP Integration':
        return <RefreshCw className="h-3 w-3 text-sky-600 shrink-0" />;
      default:
        return <Code className="h-3 w-3 text-slate-600 shrink-0" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-mono">
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
          title={`ERP System: ${erpSystem}`}
        >
          {getErpIcon(erpSystem)}
          <span className="truncate max-w-[80px]">{erpSystem}</span>
        </span>
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
          title={`Channel: ${sourceChannel}`}
        >
          {getSourceIcon(sourceChannel)}
          <span>{sourceChannel}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-semibold">
        {getErpIcon(erpSystem)}
        <span>{erpSystem}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
        {getSourceIcon(sourceChannel)}
        <span>{sourceChannel}</span>
      </span>
    </div>
  );
};
