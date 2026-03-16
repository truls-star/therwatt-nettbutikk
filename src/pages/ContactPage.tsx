import { LeadForm } from '../components/LeadForm';
import { siteConfig } from '../config/site';

export const ContactPage = () => (
  <section className="section">
    <div className="container split">
      <div className="prose">
        <h1>Contact</h1>
        <p>Telefon: {siteConfig.phone}</p>
        <p>E-post: {siteConfig.email}</p>
        <p>Org.nr: {siteConfig.orgNumber}</p>
      </div>
      <LeadForm />
    </div>
  </section>
);
