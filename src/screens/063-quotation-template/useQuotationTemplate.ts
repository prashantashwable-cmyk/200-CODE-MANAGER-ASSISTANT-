import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { QuotationTemplate } from '@/data/types';
import type { QuotationTemplateStatus } from './quotation-template.types';
import { OVERRIDE_STATE } from './quotation-template.types';

interface TemplateDraft {
  logoAssetUrl?: string;
  footerTagline: string;
  validityPeriodDays: number;
  legalBoilerplate: string;
  stateOverrideText: string;
}

function toDraft(template: QuotationTemplate): TemplateDraft {
  return {
    logoAssetUrl: template.logoAssetUrl,
    footerTagline: template.footerTagline,
    validityPeriodDays: template.validityPeriodDays,
    legalBoilerplate: template.legalBoilerplate,
    stateOverrideText: template.stateOverrides[OVERRIDE_STATE] ?? '',
  };
}

interface QuotationTemplateState {
  status: QuotationTemplateStatus;
  templates: QuotationTemplate[];
  editingTemplate: QuotationTemplate | null;
  openEdit: (template: QuotationTemplate) => void;
  closeEdit: () => void;
  draft: TemplateDraft;
  setDraftField: <K extends keyof TemplateDraft>(field: K, value: TemplateDraft[K]) => void;
  saving: boolean;
  save: () => Promise<boolean>;
  reload: () => Promise<void>;
}

const EMPTY_DRAFT: TemplateDraft = { footerTagline: '', validityPeriodDays: 15, legalBoilerplate: '', stateOverrideText: '' };

/**
 * Owns the template list and the edit form. Saving bumps the template's
 * version through the repository — an already-sent quotation keeps
 * whichever version it captured at send time (`templateVersionAtSend`),
 * so an edit here can never silently reach a customer's open quote.
 */
export function useQuotationTemplate(): QuotationTemplateState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<QuotationTemplateStatus>('loading');
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<QuotationTemplate | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await repository.listQuotationTemplates();
      setTemplates(list);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = useCallback((template: QuotationTemplate) => {
    setEditingTemplate(template);
    setDraft(toDraft(template));
  }, []);

  const closeEdit = useCallback(() => setEditingTemplate(null), []);

  const setDraftField = useCallback(<K extends keyof TemplateDraft>(field: K, value: TemplateDraft[K]) => {
    setDraft((d) => ({ ...d, [field]: value }));
  }, []);

  const save = useCallback(async () => {
    if (!editingTemplate) return false;
    setSaving(true);
    try {
      const updated = await repository.saveQuotationTemplate({
        id: editingTemplate.id,
        name: editingTemplate.name,
        variant: editingTemplate.variant,
        logoAssetUrl: draft.logoAssetUrl,
        legalBoilerplate: draft.legalBoilerplate,
        stateOverrides: { ...editingTemplate.stateOverrides, [OVERRIDE_STATE]: draft.stateOverrideText },
        validityPeriodDays: draft.validityPeriodDays,
        footerTagline: draft.footerTagline,
        updatedBy: user?.name ?? 'Admin',
      });
      await load();
      setEditingTemplate(updated);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, editingTemplate, draft, user, load]);

  return { status, templates, editingTemplate, openEdit, closeEdit, draft, setDraftField, saving, save, reload: load };
}
