import React, { useState } from 'react';
import { EmailAutomationRule, OutboxEmail, Lead } from '../types/crm';
import { formatTimeAgo, formatDate } from '../utils/formatters';
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCheck, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  Play, 
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  rules: EmailAutomationRule[];
  outbox: OutboxEmail[];
  leads: Lead[];
  onUpdateRule: (updated: EmailAutomationRule) => void;
  onSendManualEmail: (email: OutboxEmail) => void;
}

export const EmailAutomations: React.FC<Props> = ({
  rules,
  outbox,
  leads,
  onUpdateRule,
  onSendManualEmail,
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(rules[0]?.id || '');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [testLeadId, setTestLeadId] = useState<string>(leads[0]?.id || '');
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  const selectedRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  const handleSelectRule = (rule: EmailAutomationRule) => {
    setSelectedRuleId(rule.id);
    setTemplateSubject(rule.subjectTemplate);
    setTemplateBody(rule.bodyTemplate);
    setIsEditingTemplate(false);
    setTestSentMessage(null);
  };

  const handleToggleRule = (rule: EmailAutomationRule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    onUpdateRule(updated);
  };

  const handleSaveTemplate = () => {
    if (!selectedRule) return;
    const updated: EmailAutomationRule = {
      ...selectedRule,
      subjectTemplate: templateSubject || selectedRule.subjectTemplate,
      bodyTemplate: templateBody || selectedRule.bodyTemplate,
    };
    onUpdateRule(updated);
    setIsEditingTemplate(false);
  };

  const handleTriggerTestSend = () => {
    if (!selectedRule) return;
    const lead = leads.find((l) => l.id === testLeadId) || leads[0];
    if (!lead) return;

    // Dynamic variable interpolation
    const renderedSubject = (selectedRule.subjectTemplate || '')
      .replace(/{{client_name}}/g, lead.clientName)
      .replace(/{{project_name}}/g, `${lead.clientName} Residence`)
      .replace(/{{site_address}}/g, lead.projectAddress)
      .replace(/{{profile}}/g, lead.profilePreferred)
      .replace(/{{material}}/g, lead.materialPreferred)
      .replace(/{{wind_zone}}/g, lead.windZone);

    const renderedBody = (selectedRule.bodyTemplate || '')
      .replace(/{{client_name}}/g, lead.clientName)
      .replace(/{{project_name}}/g, `${lead.clientName} Residence`)
      .replace(/{{site_address}}/g, lead.projectAddress)
      .replace(/{{profile}}/g, lead.profilePreferred)
      .replace(/{{material}}/g, lead.materialPreferred)
      .replace(/{{color_name}}/g, 'FlaxPod')
      .replace(/{{wind_zone}}/g, lead.windZone)
      .replace(/{{architect}}/g, lead.companyOrArchitect || 'your architect')
      .replace(/{{quote_amount}}/g, `$${lead.estimatedValueNZD.toLocaleString()}`)
      .replace(/{{quote_number}}/g, 'Q-2026-092')
      .replace(/{{expiry_date}}/g, '30 October 2026')
      .replace(/{{pitch_degrees}}/g, String(lead.pitchDegrees));

    const newEmail: OutboxEmail = {
      id: `out-${Date.now()}`,
      ruleTitle: selectedRule.title,
      recipientEmail: lead.email,
      recipientName: lead.clientName,
      subject: renderedSubject,
      body: renderedBody,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'delivered',
    };

    onSendManualEmail(newEmail);
    // increment rule sendCount
    onUpdateRule({ ...selectedRule, sendCount: selectedRule.sendCount + 1 });
    setTestSentMessage(`Follow-up sent successfully to ${lead.clientName} (${lead.email})!`);
    setTimeout(() => setTestSentMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Automated Follow-Up Sequences</h2>
          <p className="text-xs text-slate-500">
            Keep architects, builders, and clients engaged automatically through NZBC milestones & quote reviews
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Total Triggered</span>
            <span className="font-bold text-slate-900 text-sm">
              {rules.reduce((acc, r) => acc + r.sendCount, 0)} emails
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Active Sequences</span>
            <span className="font-bold text-emerald-800 text-sm">
              {rules.filter((r) => r.enabled).length} of {rules.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Sidebar */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Active Sequence Triggers
          </h3>
          {rules.map((rule) => {
            const isSelected = rule.id === selectedRule?.id;
            return (
              <div
                key={rule.id}
                onClick={() => handleSelectRule(rule)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{rule.title}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRule(rule);
                    }}
                    className="text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span className="font-mono">Delay: {rule.delayHours}h post-event</span>
                  <span className="font-mono tabular-nums">{rule.sendCount} sent</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Rule Template Editor & Test Dispatch */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRule && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Sequence Template Details
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedRule.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditingTemplate ? (
                    <button
                      onClick={() => {
                        setTemplateSubject(selectedRule.subjectTemplate);
                        setTemplateBody(selectedRule.bodyTemplate);
                        setIsEditingTemplate(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Copy
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Save Template
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject</label>
                {isEditingTemplate ? (
                  <input
                    type="text"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-medium text-slate-900"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-medium text-slate-900">
                    {selectedRule.subjectTemplate}
                  </div>
                )}
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Body (Supports dynamic placeholders: {'{{client_name}}'}, {'{{project_name}}'}, {'{{profile}}'}, {'{{wind_zone}}'}, {'{{quote_amount}}'})
                </label>
                {isEditingTemplate ? (
                  <textarea
                    rows={8}
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-mono text-slate-900"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                    {selectedRule.bodyTemplate}
                  </div>
                )}
              </div>

              {/* Manual Test Dispatch Tool */}
              <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Dispatch Manual Follow-up Now
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Test live template rendering against actual client lead data
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={testLeadId}
                    onChange={(e) => setTestLeadId(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900"
                  >
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.clientName} ({lead.companyOrArchitect || 'Direct'}) — {lead.region}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleTriggerTestSend}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Trigger Follow-up Email
                  </button>
                </div>

                {testSentMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{testSentMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Outbox Activity Log */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Automated Follow-Up Outbox & Tracking
              </h4>
              <span className="text-xs font-mono text-slate-500">{outbox.length} logged dispatches</span>
            </div>

            <div className="space-y-2">
              {outbox.map((mail) => (
                <div
                  key={mail.id}
                  className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{mail.recipientName}</span>
                      <span className="text-[11px] text-slate-500">({mail.recipientEmail})</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{mail.subject}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right sm:text-right">
                    <span className="text-[11px] font-mono text-slate-500">{mail.sentAt}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize bg-emerald-100 text-emerald-800 font-semibold">
                      {mail.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
