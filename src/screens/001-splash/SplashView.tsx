import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/design-system';
import { useSplash } from './useSplash';
import { FLOOR_COUNT, SPLASH_KEYS as K, VALUE_PROPS } from './splash.types';

/**
 * Screen 001 — Splash / Brand Intro.
 *
 * The calmest screen in the app: the Ascension Line lighting floor by floor is
 * the whole visual, and it doubles as the launch progress indicator so there is
 * never a separate spinner.
 */
export function SplashView() {
  const { t } = useTranslation();
  const { phase, litFloors, carouselIndex, advanceCarousel, dismissWhatsNew, skip } = useSplash();

  if (phase === 'carousel') {
    const prop = VALUE_PROPS[carouselIndex];
    const isLast = carouselIndex === VALUE_PROPS.length - 1;
    return (
      <div className="ds-screen ds-screen--narrow stack" style={{ minHeight: '100dvh' }}>
        <div className="grow stack center gap-4">
          <BrandMark lit={carouselIndex + 1} />
          <h1 className="t-center t-balance">{t(prop.titleKey)}</h1>
          <p className="t-muted t-center" style={{ maxWidth: '34ch' }}>
            {t(prop.bodyKey)}
          </p>
        </div>

        <div className="stack gap-3">
          <div className="row center gap-2" aria-hidden="true">
            {VALUE_PROPS.map((item, index) => (
              <span
                key={item.id}
                style={{
                  width: index === carouselIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 'var(--radius-pill)',
                  background:
                    index <= carouselIndex
                      ? 'var(--color-accent-primary)'
                      : 'var(--color-border)',
                  transition: 'width var(--dur-base) var(--ease-standard)',
                }}
              />
            ))}
          </div>
          <span className="sr-only">
            {t(K.carousel.of, { current: carouselIndex + 1, total: VALUE_PROPS.length })}
          </span>
          <Button block onClick={advanceCarousel}>
            {isLast ? t(K.carousel.start) : t(K.carousel.next)}
          </Button>
          {!isLast && (
            <Button variant="quiet" block onClick={skip}>
              {t(K.skip)}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'whatsNew') {
    return (
      <div className="ds-screen ds-screen--narrow stack center" style={{ minHeight: '100dvh' }}>
        <Card className="full-w" title={t(K.whatsNew.title)} body={t(K.whatsNew.body)}>
          <div className="mt-4">
            <Button block onClick={dismissWhatsNew}>
              {t(K.whatsNew.dismiss)}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 'intro' and 'leaving' share the same calm doorway; leaving just fades.
  return (
    <button
      type="button"
      onClick={skip}
      aria-label={t(K.skip)}
      className="stack center gap-4"
      style={{
        minHeight: '100dvh',
        width: '100%',
        border: 0,
        background: 'var(--color-bg)',
        cursor: 'pointer',
        opacity: phase === 'leaving' ? 0 : 1,
        transition: 'opacity var(--dur-base) var(--ease-standard)',
      }}
    >
      <BrandMark lit={litFloors} />
      <div className="stack gap-2 center">
        <span className="t-display t-2xl t-semibold" style={{ letterSpacing: '0.04em' }}>
          {t('app.name')}
        </span>
        <span className="t-sm t-muted t-center">{t(K.tagline)}</span>
      </div>
      <div className="stack gap-1 center mt-4">
        <span className="t-xs t-muted">{t(K.founder)}</span>
        <span className="t-sm t-medium">{t(K.owner)}</span>
      </div>
      {/* The lighting floors are the progress indicator — no second spinner. */}
      <span className="sr-only" role="status">
        {t(K.checking)}
      </span>
    </button>
  );
}

/** The literal product as the brand mark: a shaft whose floors light upward. */
function BrandMark({ lit }: { lit: number }) {
  return (
    <span className="brand-shaft" aria-hidden="true" style={{ gap: 6 }}>
      {Array.from({ length: FLOOR_COUNT }, (_, i) => (
        <span
          key={i}
          className={`brand-shaft__floor ${
            FLOOR_COUNT - i <= lit ? 'brand-shaft__floor--lit' : ''
          }`}
          style={{
            width: 44,
            height: 5,
            transition: 'background var(--dur-base) var(--ease-standard)',
          }}
        />
      ))}
    </span>
  );
}
