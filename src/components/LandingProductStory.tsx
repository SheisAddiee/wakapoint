import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Expand } from 'lucide-react';
import { Modal } from './WorkspacePrimitives';
import { SpecularButton } from './reactbits/SpecularButton';

export function ProductPreview({ src, title, alt, caption }: { src: string; title: string; alt: string; caption: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <figure className="landing-product-preview">
      <div className="product-preview-heading"><span>{title}</span><button type="button" className="product-expand" aria-label={`Enlarge ${title.toLowerCase()} preview`} onClick={() => setOpen(true)}><Expand size={14}/></button></div>
      <button type="button" className="product-image-button" onClick={() => setOpen(true)} aria-label={`View ${title.toLowerCase()} screenshot`}><img src={src} alt={alt} width={1200} height={440} loading="lazy" decoding="async"/></button>
      <figcaption>{caption}</figcaption>
    </figure>
    <Modal open={open} onOpenChange={setOpen} title={title}><div className="product-lightbox"><img src={src} alt={alt}/></div><div className="dialog-footer"><SpecularButton className="button primary" onClick={() => setOpen(false)}>Done</SpecularButton></div></Modal>
  </>;
}

export function LandingProductStory({ onStart }: { onStart: () => void }) {
  return <>
    <section className="landing-batch-story landing-section" data-reveal>
      <div className="landing-section-heading"><div><span className="landing-kicker">THE WHOLE DAY, IN VIEW</span><h2>One address.<br/>Or the whole list.</h2></div><p>Review a batch, find missing details and prepare the handoff.</p></div>
      <ProductPreview src="/images/batch-studio.jpg" title="Batch studio" alt="WakaPoint batch studio showing two example Nigerian addresses, their extracted context, review status and export controls." caption="Example addresses shown. Review the list before export."/>
      <button className="landing-how-link" onClick={onStart}>Bring your next dispatch list <ArrowRight size={15}/></button>
    </section>
    <section className="landing-postal-story landing-section" data-reveal>
      <div><span className="landing-kicker">LOCAL KNOWLEDGE. AN OFFICIAL CONNECTION.</span><h2>A place in<br/>the postal grid.</h2><p>Keep the customer's directions. Review the destination. Check a known NIPOST postcode separately.</p><a className="landing-how-link" href="https://docs.postcode.gov.ng/" target="_blank" rel="noreferrer">Explore the NIPOST service <ArrowUpRight size={15}/></a></div>
      <figure><img src="/images/postcode-bridge.svg" alt="An illustrated workflow from customer directions to human review and official lookup of a known five-part NIPOST postcode. FC-01-A01-KP-27 is shown as an example format." width={900} height={560} loading="lazy" decoding="async"/><figcaption>Local directions stay useful. The final destination stays reviewed.</figcaption></figure>
    </section>
  </>;
}
