import { useEffect, useRef, useState } from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { ArrowDown, ArrowRight, ArrowUpRight, Bookmark, Braces, Check, ChevronDown, FileStack, Fingerprint, Layers3, LockKeyhole, MapPin, Navigation2, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BlurText } from './reactbits/BlurText';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { HeroOrbit } from './HeroOrbit';

const features = [
  { icon: Fingerprint, title: 'Address intelligence', text: 'Give landmarks, building identifiers and local delivery cues their own place. Keep the details that make an address useful.', note: 'From a description to structured context' },
  { icon: MapPin, title: 'A point you can review', text: 'Start with an approximate locality, explore the street map and confirm a delivery pin with the customer.', note: 'A human check for the final metres' },
  { icon: FileStack, title: 'A whole dispatch list', text: 'Process up to 100 addresses together, filter those that need more detail, then export your reviewed list.', note: 'One address or the whole day’s work' },
  { icon: Braces, title: 'An official postcode bridge', text: 'Look up a known NIPOST digital postcode. Confirm its existence, then review whether it matches the destination.', note: 'Official lookup through a secure connection' },
  { icon: Bookmark, title: 'Your private address library', text: 'Save reviewed context to your account. Find it again, reopen it for the next delivery and undo accidental removals.', note: 'Useful knowledge, ready for next time' },
  { icon: ShieldCheck, title: 'Privacy in the workflow', text: 'Filter common contact patterns before saving or exporting. Review the output before it leaves your workspace.', note: 'Keep the context. Protect the person.' },
];
const faqs = [
  { question: 'What does WakaPoint do?', answer: 'WakaPoint turns informal Nigerian address descriptions into structured delivery context: locality, landmarks, building or unit details and ordered delivery cues. You can review a map point, save the address to your private library and export it for dispatch.' },
  { question: 'Do I need a perfectly written address?', answer: 'No. Start with the words your customer uses. A city or district, a nearby landmark and a building or gate detail help. WakaPoint flags missing or conflicting context so you can ask for clarification before dispatch.' },
  { question: 'Does it find the exact building automatically?', answer: 'Location references are approximate locality centres, not verified building coordinates. Use the street map to place a delivery pin and confirm the final point with the customer.' },
  { question: 'Does WakaPoint generate an official NIPOST postcode?', answer: 'No. The postcode bridge checks a known NIPOST digital postcode through the official service. A successful check confirms that the code exists; you must still confirm that it matches this delivery destination.' },
  { question: 'Can I process a whole dispatch list?', answer: 'Yes. Batch studio accepts up to 100 addresses at a time, one per line or from a text file. Filter results that need more detail and review the list before exporting CSV or JSON.' },
  { question: 'Who can see my saved addresses?', answer: 'Saved addresses belong to your authenticated account. Common phone, email and explicitly labelled contact-name patterns are filtered before saving. Review remains essential because pattern detection cannot identify every personal detail.' },
  { question: 'Which locations are supported?', answer: 'Address context can be extracted from Nigerian delivery descriptions. Approximate map matching currently uses a limited collection of locality references, including areas in Abuja, Lagos, Benin City, Port Harcourt and Ibadan. If the locality is not recognised, the workspace asks for more detail instead of inventing a location.' },
  { question: 'How do I get started?', answer: 'Create an account with email or Google, choose your workspace role and home city, and start with an address. A skippable walkthrough explains the tools. You can reopen it from Help whenever you need it.' },
];

export function LandingPage({ signedIn, onStart, onSignIn, onWorkspace }: { signedIn: boolean; onStart: () => void; onSignIn: () => void; onWorkspace: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [instantFaq, setInstantFaq] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const start = signedIn ? onWorkspace : onStart;
  useEffect(() => {
    const elements = root.current?.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!elements || !('IntersectionObserver' in window)) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.visible = 'true'; observer.unobserve(entry.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
    elements.forEach(element => {
      if (!reduced.matches && element.getBoundingClientRect().top >= innerHeight) element.dataset.visible = 'false';
      observer.observe(element);
    });
    const revealAll = () => { if (reduced.matches) elements.forEach(element => { element.dataset.visible = 'true'; }); };
    reduced.addEventListener('change', revealAll);
    return () => { observer.disconnect(); reduced.removeEventListener('change', revealAll); };
  }, []);
  useEffect(() => {
    const hero = root.current?.querySelector('.landing-hero');
    const nav = root.current?.querySelector('.landing-nav');
    if (!hero || !nav || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setOverHero(entry.isIntersecting), { rootMargin: `-${nav.clientHeight}px 0px 0px 0px` });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  const scrollTo = (id: string, pointer: boolean) => {
    const element = document.getElementById(id);
    if (!pointer && element) { element.dataset.instant = 'true'; element.dataset.visible = 'true'; element.tabIndex = -1; element.focus({ preventScroll: true }); }
    element?.scrollIntoView({ behavior: pointer && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  };
  return <div className="landing" ref={root}>
    <a className="landing-skip" href="#landing-main" onClick={event => { event.preventDefault(); scrollTo('landing-main', false); }}>Skip to content</a>
    <header className="landing-nav" data-over-hero={overHero}>
      <a className="auth-brand" href="#home" aria-label="WakaPoint home"><Navigation2 size={25} strokeWidth={1.5}/><span>WakaPoint<span>.</span></span></a>
      <nav aria-label="Page sections"><button onClick={e => scrollTo('how-it-works', e.detail > 0)}>How it works</button><button onClick={e => scrollTo('landing-features', e.detail > 0)}>Features</button><button onClick={e => scrollTo('landing-faq', e.detail > 0)}>FAQs</button></nav>
      <div className="landing-nav-actions"><ThemeToggle flight/>{signedIn ? <button className="button primary" onClick={onWorkspace}>Open workspace <ArrowRight size={15}/></button> : <button className="landing-signin" onClick={onSignIn}>Sign in <ArrowUpRight size={14}/></button>}</div>
    </header>
    <main id="landing-main">
      <section className="landing-hero">
        <HeroOrbit paused={!overHero}/>
        <div className="landing-kicker"><span/>BUILT FOR THE NIGERIAN LAST MILE</div>
        <h1 aria-label="Local directions. A clearer way forward.">Local directions.<br/><BlurText text="A clearer way forward."/></h1>
        <p>Behind the school. Beside the market. Through the green gate.<br className="desktop-break"/> Turn the way people describe places into context your delivery team can use.</p>
        <div className="landing-hero-actions"><button className="button primary" onClick={start}>{signedIn ? 'Open your workspace' : 'Get started with WakaPoint'}<ArrowRight size={17}/></button><button className="landing-how-link" onClick={e => scrollTo('how-it-works', e.detail > 0)}>See how it works <ArrowDown size={15}/></button></div>
        <div className="landing-account-note"><ShieldCheck size={13}/>Your account. Your address library. Your next delivery.</div>
        <div className="landing-flow" data-reveal aria-label="Describe a destination, extract context, review and hand off">
          <div><span className="flow-number">01</span><Navigation2 size={25} strokeWidth={1.2}/><strong>The local description</strong><small>A city, a landmark, a final detail.</small></div><ArrowRight className="flow-arrow" size={22}/>
          <div><span className="flow-number">02</span><Fingerprint size={25} strokeWidth={1.2}/><strong>Structured context</strong><small>Landmarks, units and delivery cues.</small></div><ArrowRight className="flow-arrow" size={22}/>
          <div><span className="flow-number">03</span><Check size={25} strokeWidth={1.2}/><strong>A reviewed handoff</strong><small>Confirm the point. Share the details.</small></div>
        </div>
      </section>
      <section className="landing-story landing-section" data-reveal>
        <span className="landing-kicker">THE LAST MILE STARTS WITH UNDERSTANDING</span>
        <p className="landing-statement">An address is more than a street.<br/>It is the <em>local knowledge</em><br/>that gets you to the door.</p>
        <div className="landing-story-foot"><span className="landing-section-index">01 / THE IDEA</span><p>A familiar landmark. A turn everyone knows. A gate you can recognise. WakaPoint helps that knowledge travel clearly from customer to dispatch desk.</p></div>
      </section>
      <section className="landing-method" id="how-it-works" data-reveal>
        <div><span className="landing-kicker">FROM THE FIRST LANDMARK TO THE LAST MILE</span><h2>Good directions deserve<br/>a useful place to go.</h2><p>Keep the local knowledge. Add structure and a human check before the address leaves your desk.</p></div>
        <ol><li><span>01</span><div><h3>Describe the destination</h3><p>Enter a customer's address in their own words, including the city and the details a rider needs.</p></div></li><li><span>02</span><div><h3>Review what matters</h3><p>Check landmarks, building identifiers and missing details. Confirm an exact delivery pin with the customer.</p></div></li><li><span>03</span><div><h3>Connect and hand off</h3><p>Validate a known NIPOST postcode, confirm the destination match and export reviewed dispatch context.</p></div></li></ol>
      </section>
      <section className="landing-showcase landing-section" data-reveal>
        <div className="landing-showcase-copy"><span className="landing-kicker">ADDRESS INTELLIGENCE, WITH A HUMAN CHECK</span><h2>Every detail.<br/>In its place.</h2><p>Move from a message to a clear view of the destination. See what was extracted, what is missing and what needs your attention.</p><ul className="landing-checklist"><li><Check size={15}/>Landmarks and locality, organised</li><li><Check size={15}/>Building and unit details, preserved</li><li><Check size={15}/>Delivery cues, in the order received</li><li><Check size={15}/>An explicit review before the handoff</li></ul><button className="landing-how-link" onClick={start}>Open your address workspace <ArrowRight size={16}/></button></div>
        <div className="landing-context" aria-label="Address context includes locality, landmarks, building details and delivery cues">
          <div className="context-top"><span><Fingerprint size={16}/>ADDRESS CONTEXT</span><span className="context-tag">Review first</span></div>
          <div className="context-body">{[{ icon: MapPin, label: 'Locality', text: 'The area to begin your search' }, { icon: Layers3, label: 'Landmark anchors', text: 'The familiar places along the way' }, { icon: Navigation2, label: 'Building & delivery cues', text: 'The details that lead to the door' }].map(({ icon: Icon, label, text }, index) => <div className="context-row" key={label}><span className="context-icon"><Icon size={21} strokeWidth={1.2}/></span><div><span className="landing-section-index">0{index + 1}</span><h3>{label}</h3><p>{text}</p></div><Check size={15}/></div>)}</div>
          <div className="context-bottom"><ShieldCheck size={15}/><span>Context extracted. Final point confirmed by you.</span></div>
        </div>
      </section>
      <section className="landing-features" id="landing-features" data-reveal>
        <div className="landing-section-heading"><div><span className="landing-kicker">ONE WORKSPACE, A CLEARER WORKFLOW</span><h2>Built around the work.</h2></div><p>From the first address of the morning to the final dispatch list. The tools belong together.</p></div>
        <div className="landing-feature-grid">{features.map(({ icon: Icon, title, text, note }, index) => <SpotlightCard key={title}><article><div className="feature-top"><Icon size={24} strokeWidth={1.25}/><span className="landing-section-index">0{index + 1}</span></div><h3>{title}</h3><p>{text}</p><small>{note}</small></article></SpotlightCard>)}</div>
      </section>
      <section className="landing-roles landing-section" data-reveal>
        <div className="landing-section-heading"><div><span className="landing-kicker">DIFFERENT ROLES. THE SAME DESTINATION.</span><h2>A better starting point<br/>for your kind of work.</h2></div><p>Choose your workspace role during setup. Start with the task that matters to you.</p></div>
        <div className="landing-role-grid">{[{ icon: Navigation2, title: 'Dispatch & operations', text: 'Bring clarity to the addresses you receive. Review delivery points, work through a batch and keep useful destinations in your library.', action: 'Plan the next handoff' }, { icon: Bookmark, title: 'Merchants & businesses', text: 'Capture the details your customers know. Check for missing context before passing an address to your delivery team.', action: 'Capture a clearer destination' }, { icon: Braces, title: 'Developers', text: 'Explore structured output and the checkout address field. Understand the postcode bridge before bringing it into your own flow.', action: 'Explore the integration tools' }].map(({ icon: Icon, title, text, action }) => <article key={title}><Icon size={26} strokeWidth={1.2}/><h3>{title}</h3><p>{text}</p><button className="landing-how-link" onClick={start}>{action}<ArrowUpRight size={14}/></button></article>)}</div>
      </section>
      <section className="landing-privacy landing-section" data-reveal>
        <div className="landing-privacy-heading"><span className="privacy-emblem"><ShieldCheck size={34} strokeWidth={1}/></span><span className="landing-kicker">CARE IS PART OF THE WORKFLOW</span><h2>Useful context.<br/>Considered handling.</h2><p>Customer directions can include personal details. Build the review into the way you work.</p></div>
        <div className="landing-privacy-points"><div><Fingerprint size={20}/><h3>Filter common contact patterns</h3><p>Phone numbers, emails and explicitly labelled contact names are removed from structured output.</p></div><div><LockKeyhole size={20}/><h3>Keep a private library</h3><p>Cloud records are restricted to your signed-in account. Sign out when leaving a shared device.</p></div><div><Check size={20}/><h3>Make the final check yourself</h3><p>Review for remaining personal details, confirm the destination and approve the export before dispatch.</p></div></div>
      </section>
      <section className="landing-faq landing-section" id="landing-faq" data-reveal data-instant={instantFaq || undefined}>
        <div><span className="landing-kicker">A FEW THINGS, MADE CLEAR</span><h2>Good questions.<br/>Clear answers.</h2><p>Understand the tools before your first delivery.</p><button className="landing-how-link" onClick={start}>Get started <ArrowUpRight size={15}/></button></div>
        <Accordion.Root className="faq-list">{faqs.map(({ question, answer }, index) => <Accordion.Item value={question} key={question} className="faq-item"><Accordion.Header><Accordion.Trigger className="faq-trigger" onClick={event => setInstantFaq(event.detail === 0)}><span className="landing-section-index">{String(index + 1).padStart(2, '0')}</span><span>{question}</span><ChevronDown size={17}/></Accordion.Trigger></Accordion.Header><Accordion.Panel className="faq-panel"><p>{answer}</p></Accordion.Panel></Accordion.Item>)}</Accordion.Root>
      </section>
      <section className="landing-closing" data-reveal><span className="landing-kicker">A WAY FORWARD FOR EVERY ADDRESS</span><Navigation2 className="closing-mark" size={45} strokeWidth={1}/><h2>Start with an address.<br/>Make the next step clearer.</h2><button className="button primary" onClick={start}>{signedIn ? 'Return to your workspace' : 'Create your account'}<ArrowRight size={17}/></button><p>Email or Google sign-in. Guided setup. A private workspace.</p></section>
    </main>
    <footer className="landing-footer"><a className="auth-brand" href="#home"><Navigation2 size={20} strokeWidth={1.5}/><span>WakaPoint<span>.</span></span></a><span>Designed for the way Nigeria gives directions.</span><a href="https://docs.postcode.gov.ng/" target="_blank" rel="noreferrer">NIPOST documentation <ArrowUpRight size={13}/></a></footer>
  </div>;
}
