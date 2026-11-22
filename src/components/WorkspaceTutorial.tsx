import { SpecularButton } from "./reactbits/SpecularButton";
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, Fingerprint, MapPin, PencilLine, ShieldCheck } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';

const steps = [
  { title: "Start with the customer's own words.", body: 'Enter the real delivery address, including a city, nearby landmark, gate or unit detail. Contact patterns are filtered before output is saved.', icon: PencilLine, tip: 'You can paste a message directly into Address input.' },
  { title: 'Resolve, then check the details.', body: 'Resolve address extracts landmarks, building details and delivery cues. Missing or conflicting information is flagged so you can ask the customer before dispatch.', icon: Fingerprint, tip: 'Coverage describes what was extracted. It is not a delivery accuracy score.' },
  { title: 'Confirm the final delivery point.', body: 'The map starts with an approximate locality. Place a delivery pin on the street map and confirm it with the customer. A locality centre is never an exact building location.', icon: MapPin, tip: 'Keyboard users can pan with arrows and press Enter while placing a pin.' },
  { title: 'Check a postcode with NIPOST.', body: 'Use Postcode bridge to look up an official digital postcode. NIPOST confirms that the code exists; you must still confirm that it matches this destination before attaching it.', icon: ShieldCheck, tip: 'Official lookup uses your secure service connection and may use NIPOST credits.' },
  { title: 'Save it. Review it. Hand it off.', body: 'Save stores the address in your private account library. Export asks you to review the output before downloading dispatch JSON. Batch studio handles up to 100 real addresses at a time.', icon: Bookmark, tip: 'Reopen this walkthrough anytime from Help. You can skip now and start working.' },
];

export function WorkspaceTutorial({ open, onFinish }: { open: boolean; onFinish: (outcome: 'complete' | 'skipped') => Promise<void> }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (open) setStep(0); }, [open]);
  const item = steps[step], Icon = item.icon;
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) void onFinish('skipped'); }}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop"/><Dialog.Popup className="dialog-popup tutorial-popup"><div className="tutorial-top"><span className="eyebrow">YOUR WAKAPOINT WALKTHROUGH</span><button className="auth-text-button" onClick={() => void onFinish('skipped')}>Skip tutorial</button></div><div className="tutorial-step-icon"><Icon size={28} strokeWidth={1.4}/></div><Dialog.Title>{item.title}</Dialog.Title><Dialog.Description className="dialog-description">{item.body}</Dialog.Description><div className="tutorial-tip"><Check size={16}/><p>{item.tip}</p></div><div className="tutorial-progress" aria-label={`Tutorial step ${step + 1} of ${steps.length}`}>{steps.map((_, index) => <span key={index} className={index <= step ? 'complete' : ''}/>)}<strong>{step + 1} / {steps.length}</strong></div><div className="dialog-footer"><button className="button secondary" disabled={step === 0} onClick={() => setStep(value => value - 1)}><ArrowLeft size={15}/>Back</button><SpecularButton className="button primary" onClick={() => step < steps.length - 1 ? setStep(value => value + 1) : void onFinish('complete')}>{step < steps.length - 1 ? 'Next' : 'Start resolving'}<ArrowRight size={15}/></SpecularButton></div></Dialog.Popup></Dialog.Portal></Dialog.Root>;
}
