import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Truck, RefreshCw, HeadphonesIcon } from 'lucide-react';
import { getFeaturedProducts } from '../../services/products.service';
import ProductCard from '../../components/product/ProductCard';
import Button from '../../components/ui/Button';
import { useI18n } from '../../context/I18nContext';
import styles from './Home.module.css';

const AUTOPLAY_DELAY = 5000;

const HeroSlider = () => {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const SLIDES = [
    {
      img: '/hero1.webp',
      eyebrow: t('hero.slide1.eyebrow'),
      title: t('hero.slide1.title'),
      titleAccent: t('hero.slide1.accent'),
      sub: t('hero.slide1.sub'),
      cta: { label: t('hero.slide1.cta'), to: '/catalogue' },
    },
    {
      img: '/hero2.png',
      eyebrow: t('hero.slide2.eyebrow'),
      title: t('hero.slide2.title'),
      titleAccent: t('hero.slide2.accent'),
      sub: t('hero.slide2.sub'),
      cta: { label: t('hero.slide2.cta'), to: '/catalogue' },
    },
    {
      img: '/hero3.png',
      eyebrow: t('hero.slide3.eyebrow'),
      title: t('hero.slide3.title'),
      titleAccent: t('hero.slide3.accent'),
      sub: t('hero.slide3.sub'),
      cta: { label: t('hero.slide3.cta'), to: '/compte/inscription' },
    },
  ];

  const prev = useCallback(() => setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);
  const next = useCallback(() => setCurrent((i) => (i + 1) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, AUTOPLAY_DELAY);
    return () => clearTimeout(t);
  }, [current, paused, next]);

  return (
    <section
      className={styles.hero}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`${styles.slide} ${i === current ? styles.slideActive : ''}`}
          aria-hidden={i !== current}
        >
          <img src={slide.img} alt="" className={styles.slideImg} />
          <div className={styles.slideOverlay} />
        </div>
      ))}

      {/* Contenu */}
      <div className={styles.heroContent}>
        <div className={styles.heroEyebrow}>{SLIDES[current].eyebrow}</div>
        <h1 className={styles.heroTitle}>
          {SLIDES[current].title}<br />
          <span>{SLIDES[current].titleAccent}</span>
        </h1>
        <p className={styles.heroSub}>{SLIDES[current].sub}</p>
        <div className={styles.heroCtas}>
          <Link to={SLIDES[current].cta.to}>
            <Button size="lg">{SLIDES[current].cta.label}</Button>
          </Link>
        </div>
      </div>

      {/* Flèches */}
      <button className={`${styles.arrow} ${styles.arrowPrev}`} onClick={prev} aria-label="Précédent">
        <ChevronLeft size={22} />
      </button>
      <button className={`${styles.arrow} ${styles.arrowNext}`} onClick={next} aria-label="Suivant">
        <ChevronRight size={22} />
      </button>

      {/* Points */}
      <div className={styles.dots}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

const Home = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const railRef = useRef(null);

  useEffect(() => {
    getFeaturedProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scrollRail = (dir) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ left: dir * 560, behavior: 'smooth' });
  };

  return (
    <>
      <HeroSlider />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{t('home.newArrivals')}</p>
            <h2 className={styles.sectionTitle}>{t('home.featuredTitle')}</h2>
          </div>
          <div className={styles.sectionActions}>
            <button className={styles.railBtn} onClick={() => scrollRail(-1)} aria-label="Précédent">
              <ChevronLeft size={18} />
            </button>
            <button className={styles.railBtn} onClick={() => scrollRail(1)} aria-label="Suivant">
              <ChevronRight size={18} />
            </button>
            <Link to="/catalogue" className={styles.sectionLink}>
              {t('home.seeAll')} <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Bento desktop */}
        <div className={styles.bento}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`${styles.skeleton} ${styles[`bentoItem${i + 1}`]}`} />
              ))
            : products.slice(0, 5).map((p, i) => (
                <div key={p.id} className={styles[`bentoItem${i + 1}`]}>
                  <ProductCard product={p} />
                </div>
              ))
          }
        </div>

        {/* Rail mobile */}
        <div className={styles.rail} ref={railRef}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.skeleton} />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </section>

      {/* Section réassurance */}
      <section className={styles.reassurance}>
        <div className={styles.reassuranceInner}>
          {[
            {
              icon: <ShieldCheck size={28} />,
              title: t('home.trust.paymentTitle'),
              desc:  t('home.trust.paymentDesc'),
            },
            {
              icon: <Truck size={28} />,
              title: t('home.trust.deliveryTitle'),
              desc:  t('home.trust.deliveryDesc'),
            },
            {
              icon: <RefreshCw size={28} />,
              title: t('home.trust.returnsTitle'),
              desc:  t('home.trust.returnsDesc'),
            },
            {
              icon: <HeadphonesIcon size={28} />,
              title: t('home.trust.supportTitle'),
              desc:  t('home.trust.supportDesc'),
            },
          ].map((item) => (
            <div key={item.title} className={styles.reassuranceCard}>
              <div className={styles.reassuranceIcon}>{item.icon}</div>
              <h3 className={styles.reassuranceTitle}>{item.title}</h3>
              <p className={styles.reassuranceDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
