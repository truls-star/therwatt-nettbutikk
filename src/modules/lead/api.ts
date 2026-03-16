export type LeadPayload = {
  name: string;
  phone: string;
  email: string;
  address: string;
  selectedRegion: string;
  calculationResults: string;
  recommendedSystem: string;
};

export const submitLead = async (payload: LeadPayload) => {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.success) {
    throw new Error(body?.message || 'Kunne ikke sende e-post akkurat na.');
  }

  return body;
};
