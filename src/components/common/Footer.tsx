import { SiteConfig } from '../../content/siteContent';

interface FooterProps {
  content: SiteConfig;
}

const Footer = ({ content }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const hasEmail = Boolean(content.contactEmail.trim());
  const hasPhone = Boolean(content.contactPhone.trim());
  const hasContact = hasEmail || hasPhone;

  return (
    <footer className="border-t border-gold-400/20 bg-dark-800 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <h3 className="mb-4 font-serif text-xl font-bold text-gold-400">
              {content.siteName}
            </h3>

            <p className="text-sm leading-relaxed text-gray-400">
              {content.footerDescription}
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-200">
              {content.footer.quickLinksTitle}
            </h4>

            <ul className="space-y-3">
              <li>
                <a href="#home" className="text-sm text-gray-400 transition-colors duration-200 hover:text-gold-400">
                  {content.footer.quickHome}
                </a>
              </li>
              <li>
                <a href="#professionals" className="text-sm text-gray-400 transition-colors duration-200 hover:text-gold-400">
                  {content.footer.quickProfessionals}
                </a>
              </li>
              <li>
                <a href="#services" className="text-sm text-gray-400 transition-colors duration-200 hover:text-gold-400">
                  {content.footer.quickServices}
                </a>
              </li>
              <li>
                <a href="#booking" className="text-sm text-gray-400 transition-colors duration-200 hover:text-gold-400">
                  {content.footer.quickBooking}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-200">
              {content.footer.contactTitle}
            </h4>

            {hasContact ? (
              <ul className="space-y-3 text-sm">
                {hasEmail && (
                  <li className="flex items-center gap-3">
                    <svg className="h-5 w-5 shrink-0 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-400">{content.contactEmail}</span>
                  </li>
                )}

                {hasPhone && (
                  <li className="flex items-center gap-3">
                    <svg className="h-5 w-5 shrink-0 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-400">{content.contactPhone}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="rounded-2xl border border-gold-400/20 bg-dark-700 p-3 text-sm text-gray-400">
                Contato ainda não configurado.
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-gold-400/10 pt-8 text-center">
          <p className="text-sm text-gray-500">
            © {currentYear} {content.siteName}. {content.footer.copyrightSuffix}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
