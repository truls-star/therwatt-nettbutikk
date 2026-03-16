import { useState } from 'react';
import { submitLead, type LeadPayload } from '../modules/lead/api';

type LeadFormProps = {
  selectedRegion?: string;
  calculationResults?: string;
  recommendedSystem?: string;
};

const initialForm: LeadPayload = {
  name: '',
  phone: '',
  email: '',
  address: '',
  selectedRegion: '',
  calculationResults: '',
  recommendedSystem: ''
};

export const LeadForm = ({ selectedRegion, calculationResults, recommendedSystem }: LeadFormProps) => {
  const [form, setForm] = useState<LeadPayload>({
    ...initialForm,
    selectedRegion: selectedRegion || '',
    calculationResults: calculationResults || '',
    recommendedSystem: recommendedSystem || ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      await submitLead(form);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Noe gikk galt.');
    }
  };

  return (
    <form className="lead-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          Navn
          <input required value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        </label>
        <label>
          Telefon
          <input required value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
        </label>
        <label>
          E-post
          <input required type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
        </label>
        <label>
          Adresse
          <input required value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
        </label>
      </div>

      <label>
        Region
        <input value={form.selectedRegion} onChange={(event) => setForm((prev) => ({ ...prev, selectedRegion: event.target.value }))} />
      </label>
      <label>
        Beregningsresultater
        <textarea rows={4} value={form.calculationResults} onChange={(event) => setForm((prev) => ({ ...prev, calculationResults: event.target.value }))} />
      </label>
      <label>
        Anbefalt system
        <input value={form.recommendedSystem} onChange={(event) => setForm((prev) => ({ ...prev, recommendedSystem: event.target.value }))} />
      </label>

      <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sender...' : 'Send foresporsel'}
      </button>

      {status === 'success' && <p className="status success">Foresporsel er sendt til Therwatt.</p>}
      {status === 'error' && <p className="status error">{errorMessage}</p>}
    </form>
  );
};
