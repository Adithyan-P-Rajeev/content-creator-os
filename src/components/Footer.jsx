const steps = [
  { icon: 'fa-solid fa-lightbulb', label: 'Idea' },
  { icon: 'fa-solid fa-magnifying-glass', label: 'Research' },
  { icon: 'fa-solid fa-clapperboard', label: 'Record' },
  { icon: 'fa-solid fa-circle-check', label: 'Publish' },
]

const socials = [
  { icon: 'fa-solid fa-envelope', label: 'Email', href: 'mailto:hello@contentcreator.os' },
  { icon: 'fa-brands fa-instagram', label: 'Instagram', href: '#' },
  { icon: 'fa-brands fa-facebook-f', label: 'Facebook', href: '#' },
  { icon: 'fa-brands fa-x-twitter', label: 'X', href: '#' },
  { icon: 'fa-brands fa-threads', label: 'Threads', href: '#' },
  { icon: 'fa-brands fa-youtube', label: 'YouTube', href: '#' },
]

export default function Footer() {
  return (
    <>
      <section className="steps">
        {steps.map(s => (
          <div className="step" key={s.label}>
            <div className="step-icon"><i className={s.icon}></i></div>
            <div className="step-body"><h3>{s.label}</h3></div>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span className="brand-pill">OS</span>
          Content Creator
        </div>

        <div className="footer-socials">
          {socials.map(s => (
            <a key={s.label} className="footer-social" href={s.href} aria-label={s.label} title={s.label}>
              <i className={s.icon}></i>
            </a>
          ))}
        </div>

        <p className="landing-footer-copy">© {new Date().getFullYear()} Content Creator OS</p>
      </footer>
    </>
  )
}
