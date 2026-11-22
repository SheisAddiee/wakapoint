import { SpecularButton } from "./reactbits/SpecularButton";
import { useId, useState } from 'react';
import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react';
import { resolveAddress, type AddressResult } from '../lib/addressResolver';

/** Reusable, on-device address capture. The host decides how to verify and persist the result. */
export function CheckoutAddressField({ onResolved }: { onResolved?: (result: AddressResult) => void }) {
  const [input, setInput] = useState(''), [result, setResult] = useState<AddressResult | null>(null), [error, setError] = useState('');
  const fieldId = useId();
  return <form onSubmit={e => { e.preventDefault(); try { const value = resolveAddress(input); setResult(value); setError(''); onResolved?.(value); } catch (err) { setError((err as Error).message); } }}><div className="form-field"><label htmlFor={fieldId}>Delivery address</label><textarea id={fieldId} maxLength={2000} style={{ minHeight: 100 }} value={input} onChange={e => { setInput(e.target.value); setResult(null); setError(''); }} placeholder="Describe your address using a nearby landmark…" aria-invalid={!!error} aria-describedby={error ? fieldId + '-error' : undefined}/></div><SpecularButton className="button primary" disabled={!input.trim()} type="submit">Review delivery details <ArrowRight size={15}/></SpecularButton>{error && <p className="inline-error" id={fieldId + '-error'} role="alert">{error}</p>}{result && <div className="status-box"><MapPin size={14}/>{result.normalized}<p className="caption">{result.location ? `${result.location.name} detected · confirm your exact delivery point with the merchant.` : 'Add a supported city or district.'}</p></div>}<p className="caption"><ShieldCheck size={12} style={{ display: 'inline', verticalAlign: 'middle' }}/> Address context is processed on this device.</p></form>;
}
