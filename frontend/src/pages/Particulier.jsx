import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, ArrowRight } from 'lucide-react'

const rotatingWords = [
  'une rénovation',
  'un transport',
  'un nettoyage',
  'un service à domicile'
]

export default function Particulier() {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    document.title = 'Particuliers - Indebel'
    const interval = window.setInterval(() => {
      setWordIndex(current => (current + 1) % rotatingWords.length)
    }, 2400)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <main className="particulier-page">
      <header className="particulier-header">
        <Link to="/particulier" className="particulier-logo" aria-label="Indebel - Accueil particuliers">
          <img src="/logo.png" alt="Indebel" />
          <span>Indebel</span>
        </Link>

        <a href="tel:+32400000000" className="particulier-call-button">
          <Phone className="h-4 w-4" />
          <span>Appeler maintenant</span>
        </a>
      </header>

      <section className="particulier-hero">
        <div className="particulier-hero-inner">
          <p className="particulier-kicker">Service gratuit et sans engagement</p>

          <h1>
            Trouvez un professionnel fiable pour vos projets.
          </h1>

          <div className="particulier-action-line">
            <p>
              Vous cherchez un expert pour{' '}
              <span className="particulier-rotating-word" aria-live="polite">
                {rotatingWords[wordIndex]}
              </span>
              ?
            </p>

            <Link to="/demande-devis" className="particulier-start-button">
              <span>Commencez</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
