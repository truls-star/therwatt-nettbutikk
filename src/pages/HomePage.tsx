import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Droplets, Flame, Gauge, ShieldCheck, ShoppingBag, Wrench } from 'lucide-react';
import { LeadForm } from '../components/LeadForm';
import { siteConfig } from '../config/site';

const services = [
  { title: 'Geoenergi', text: 'Prosjektering og leveranse av komplette bergvarmeanlegg.', icon: <Flame size={20} /> },
  { title: 'Luft-vann varmepumper', text: 'Dimensjonering og installasjon for bolig og naring.', icon: <Gauge size={20} /> },
  { title: 'Vannbaren varme', text: 'Systemdesign for gulvvarme, shunt og distribusjon.', icon: <Droplets size={20} /> },
  { title: 'Rdgivning', text: 'Teknisk kontroll, energiberegning og kostnadsoptimalisering.', icon: <Wrench size={20} /> }
];

export const HomePage = () => {
  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">Premium energi- og VVS-partner</p>
          <h1>{siteConfig.heroHeadline}</h1>
          <p>{siteConfig.heroCopy}</p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/energy-calculator">
              Start energiberegning
            </Link>
            <Link className="btn btn-secondary" to="/services">
              Se vare tjenester
            </Link>
            <Link className="btn btn-ghost" to="/webshop">
              Apne nettbutikk
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-3">
          <article className="feature-card">
            <Calculator size={20} />
            <h3>Teknisk kalkulator</h3>
            <p>Beregn effektbehov, arsforbruk, SPF og anbefalt varmepumpestorrelse.</p>
          </article>
          <article className="feature-card">
            <ShoppingBag size={20} />
            <h3>B2B nettbutikk</h3>
            <p>Varenummer-fokusert katalog med pris inkl. mva og rask filtrering.</p>
          </article>
          <article className="feature-card">
            <ShieldCheck size={20} />
            <h3>Dokumenterte losninger</h3>
            <p>Leveranse med sporbar produktdata, tydelig besparelse og solide valg.</p>
          </article>
        </div>
      </section>

      <section className="section muted">
        <div className="container">
          <h2>Tjenester</h2>
          <div className="grid-4">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                {service.icon}
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <h2>Hvorfor velge Therwatt</h2>
            <ul className="clean-list">
              <li>Teknisk korrekt beregningsmotor med norsk klimamodell</li>
              <li>Rask respons fra rådgivere med fagbrev og prosjekteringsbakgrunn</li>
              <li>Helhetlig leveranse fra energi-analyse til ferdig varmeanlegg</li>
            </ul>
          </div>
          <div className="callout-card">
            <h3>Varme- og energisystemer</h3>
            <p>Fra enebolig til næringsbygg: riktig løsning, riktig dimensjonering, riktig dokumentasjon.</p>
            <Link className="text-link" to="/heat-pumps">
              Utforsk varmepumper <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section muted">
        <div className="container split">
          <div>
            <h2>Varmepumpelosninger</h2>
            <p>Bergvarme og luft-vann med tydelig SPF, driftssikkerhet og god livssykluskostnad.</p>
          </div>
          <div>
            <h2>Vannbaren varme</h2>
            <p>Gulvvarme med riktig sløyfelengde, fordelere, aktuatorer og styring.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <h2>Nettbutikk for fagfolk</h2>
            <p>Ahlsell-inspirert arbeidsflyt for installatører: søk pa varenummer, filtrer raskt og bygg handlekurv effektivt.</p>
          </div>
          <Link className="btn btn-primary" to="/webshop">
            Gå til webshop
          </Link>
        </div>
      </section>

      <section className="section muted" id="lead">
        <div className="container">
          <h2>Kontakt oss for tilbud</h2>
          <LeadForm />
        </div>
      </section>
    </div>
  );
};
