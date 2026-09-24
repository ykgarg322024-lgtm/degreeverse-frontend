import { supabase, workerFetch } from './supabase';

// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════
export const auth = {
  signIn: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb)
};

// ══════════════════════════════════════
// LEADS
// ══════════════════════════════════════
export const leads = {
  getAll: async ({ search, university, status, campaign, page = 1, pageSize = 20 } = {}) => {
    let q = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) q = q.or(`full_name.ilike.%${search}%,mobile.ilike.%${search}%,university.ilike.%${search}%`);
    if (university) q = q.eq('university', university);
    if (status) q = q.eq('status', status);

    return q;
  },

  getById: (id) => supabase.from('leads').select('*').eq('id', id).single(),

  create: (data) => supabase.from('leads').insert(data).select().single(),

  update: (id, data) =>
    supabase.from('leads').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id),

  markDoNotContact: async (id) => {
    // Cancel all pending messages
    await supabase
      .from('message_queue')
      .update({ status: 'cancelled' })
      .eq('lead_id', id)
      .in('status', ['pending', 'scheduled']);

    // Pause in all campaigns
    await supabase
      .from('campaign_leads')
      .update({ status: 'do_not_contact' })
      .eq('lead_id', id);

    return supabase
      .from('leads')
      .update({ status: 'do_not_contact', do_not_contact: true })
      .eq('id', id);
  },

  bulkImport: async (rows) => {
    // Normalize phone numbers and upsert
    const normalized = rows.map(r => ({
      ...r,
      mobile: normalizePhone(r.mobile),
      whatsapp_number: normalizePhone(r.whatsapp_number || r.mobile)
    }));
    return supabase
      .from('leads')
      .upsert(normalized, { onConflict: 'mobile', ignoreDuplicates: false })
      .select();
  },

  getUniversities: async () => {
    const { data } = await supabase
      .from('leads')
      .select('university')
      .not('university', 'is', null);
    return [...new Set(data?.map(r => r.university) || [])].sort();
  }
};

// ══════════════════════════════════════
// CAMPAIGNS
// ══════════════════════════════════════
export const campaigns = {
  getAll: () =>
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }),

  getById: (id) =>
    supabase.from('campaigns').select(`
      *,
      campaign_message_steps(*, message_templates(*)),
      campaign_leads(count)
    `).eq('id', id).single(),

  create: async ({ campaignData, stepData, leadFilter }) => {
    // Create campaign
    const { data: camp, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();
    if (error) throw error;

    // Insert steps
    if (stepData?.length) {
      await supabase.from('campaign_message_steps').insert(
        stepData.map((s, i) => ({ ...s, campaign_id: camp.id, step_number: i + 1 }))
      );
    }

    // Enroll leads
    const { data: targetLeads } = await buildLeadQuery(leadFilter);
    if (targetLeads?.length) {
      await supabase.from('campaign_leads').insert(
        targetLeads.map(l => ({ campaign_id: camp.id, lead_id: l.id, status: 'active' }))
      );

      // Schedule first message for each lead
      const steps = stepData || [];
      const firstStep = steps.find(s => s.step_number === 1) || steps[0];
      if (firstStep) {
        const now = new Date();
        await supabase.from('message_queue').insert(
          targetLeads.map(l => ({
            idempotency_key: `${camp.id}-${l.id}-step-1`,
            campaign_id: camp.id,
            campaign_lead_id: null, // Will be resolved by worker
            lead_id: l.id,
            template_id: firstStep.template_id,
            step_number: 1,
            scheduled_at: now.toISOString(),
            status: 'pending'
          }))
        );
      }
    }

    return camp;
  },

  updateStatus: (id, status) =>
    supabase.from('campaigns').update({ status, updated_at: new Date().toISOString() }).eq('id', id),

  pause: (id) => campaigns.updateStatus(id, 'paused'),
  resume: (id) => campaigns.updateStatus(id, 'active'),
  stop: (id) => campaigns.updateStatus(id, 'stopped'),

  stopAll: async () => {
    await supabase
      .from('campaigns')
      .update({ status: 'paused' })
      .eq('status', 'active');
    await supabase
      .from('message_queue')
      .update({ status: 'cancelled' })
      .in('status', ['pending', 'scheduled']);
  },

  getStats: async (id) => {
    const { data: logs } = await supabase
      .from('message_logs')
      .select('status')
      .eq('campaign_id', id);

    const stats = { sent: 0, failed: 0, total: logs?.length || 0 };
    logs?.forEach(l => { if (l.status === 'sent') stats.sent++; else if (l.status === 'failed') stats.failed++; });
    return stats;
  }
};

// ══════════════════════════════════════
// TEMPLATES
// ══════════════════════════════════════
export const templates = {
  getAll: () =>
    supabase.from('message_templates').select('*').order('sequence_number'),

  create: (data) =>
    supabase.from('message_templates').insert(data).select().single(),

  update: (id, data) =>
    supabase.from('message_templates')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id),

  delete: (id) =>
    supabase.from('message_templates').delete().eq('id', id)
};

// ══════════════════════════════════════
// MESSAGE QUEUE
// ══════════════════════════════════════
export const queue = {
  getPending: (page = 1, pageSize = 50) =>
    supabase
      .from('message_queue')
      .select(`
        *,
        leads(full_name, mobile),
        campaigns(name),
        message_templates(name)
      `, { count: 'exact' })
      .in('status', ['pending', 'scheduled'])
      .order('scheduled_at', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1),

  cancel: (id) =>
    supabase.from('message_queue').update({ status: 'cancelled' }).eq('id', id),

  cancelAll: (campaignId) =>
    supabase.from('message_queue')
      .update({ status: 'cancelled' })
      .eq('campaign_id', campaignId)
      .in('status', ['pending', 'scheduled'])
};

// ══════════════════════════════════════
// MESSAGE LOGS (history)
// ══════════════════════════════════════
export const history = {
  getAll: async ({ campaignId, status, dateFrom, dateTo, page = 1, pageSize = 50 } = {}) => {
    let q = supabase
      .from('message_logs')
      .select(`
        *,
        leads(full_name, mobile),
        campaigns(name),
        message_templates(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (campaignId) q = q.eq('campaign_id', campaignId);
    if (status) q = q.eq('status', status);
    if (dateFrom) q = q.gte('sent_at', dateFrom);
    if (dateTo) q = q.lte('sent_at', dateTo);

    return q;
  }
};

// ══════════════════════════════════════
// WHATSAPP
// ══════════════════════════════════════
export const whatsapp = {
  getStatus: () =>
    supabase.from('whatsapp_sessions').select('*').eq('session_key', 'main').single(),

  connect: () => workerFetch('/connect', { method: 'POST' }),
  disconnect: () => workerFetch('/disconnect', { method: 'POST' }),
  getQR: () => workerFetch('/qr'),
  getWorkerHealth: () => workerFetch('/health'),

  subscribeToStatus: (cb) => {
    const channel = supabase
      .channel('wa-session')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_sessions',
        filter: 'session_key=eq.main'
      }, (payload) => cb(payload.new))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
};

// ══════════════════════════════════════
// REPORTS
// ══════════════════════════════════════
export const reports = {
  getDailyStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('message_logs')
      .select('status')
      .gte('created_at', today);

    return {
      sent: data?.filter(r => r.status === 'sent').length || 0,
      failed: data?.filter(r => r.status === 'failed').length || 0,
      total: data?.length || 0
    };
  },

  getWeeklyStats: async () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const { data } = await supabase
        .from('message_logs')
        .select('status')
        .gte('created_at', dateStr + 'T00:00:00')
        .lte('created_at', dateStr + 'T23:59:59');

      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        sent: data?.filter(r => r.status === 'sent').length || 0,
        failed: data?.filter(r => r.status === 'failed').length || 0
      });
    }
    return days;
  },

  getCampaignStats: async () => {
    const { data: campaigns } = await supabase.from('campaigns').select('id, name, status');
    const stats = [];
    for (const c of (campaigns || [])) {
      const { data: leads } = await supabase.from('campaign_leads').select('status').eq('campaign_id', c.id);
      const { data: logs } = await supabase.from('message_logs').select('status').eq('campaign_id', c.id);
      stats.push({
        ...c,
        leads: leads?.length || 0,
        sent: logs?.filter(l => l.status === 'sent').length || 0,
        failed: logs?.filter(l => l.status === 'failed').length || 0,
        replies: leads?.filter(l => l.status === 'replied').length || 0,
        interested: 0,
        converted: 0
      });
    }
    return stats;
  }
};

// ══════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════
export const audit = {
  log: (action, entityType, entityId, details) =>
    supabase.from('audit_logs').insert({ action, entity_type: entityType, entity_id: entityId, details }),

  getAll: (page = 1, pageSize = 50) =>
    supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)
};

// ══════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════
export const settings = {
  get: () => supabase.from('settings').select('*').single(),
  update: (data) => supabase.from('settings').update(data).not('id', 'is', null)
};

// ══════════════════════════════════════
// REALTIME SUBSCRIPTIONS
// ══════════════════════════════════════
export const realtime = {
  subscribeToQueue: (cb) => {
    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_queue' }, cb)
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  subscribeToReplies: (cb) => {
    const channel = supabase
      .channel('new-replies')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies' }, cb)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
};

// ══════════════════════════════════════
// EXPORT HELPERS
// ══════════════════════════════════════
export const exportToCSV = (data, filename) => {
  const Papa = window.Papa;
  const csv = Papa ? Papa.unparse(data) : data.map(r => Object.values(r).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ── Helpers ──
function normalizePhone(mobile) {
  if (!mobile) return '';
  let num = String(mobile).replace(/\D/g, '');
  if (num.length === 10) num = '91' + num;
  if (num.startsWith('0')) num = '91' + num.slice(1);
  return num;
}

async function buildLeadQuery(filter) {
  let q = supabase.from('leads').select('id').eq('do_not_contact', false);
  if (filter?.university) q = q.eq('university', filter.university);
  if (filter?.course) q = q.eq('course', filter.course);
  if (filter?.status) q = q.eq('status', filter.status);
  return q;
}
