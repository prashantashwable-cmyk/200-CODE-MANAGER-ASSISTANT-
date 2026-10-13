import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPinLine, Warning, WifiSlash } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Field, MapCanvas, Screen, ScreenHeader, TextArea } from '@/design-system';
import { CaptureStepRail } from '@/features/leadCapture/CaptureStepRail';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { useCaptureGps } from './useCaptureGps';
import { CAPTURE_GPS_KEYS as K, PHOTO_SLOTS } from './capture-gps.types';

/**
 * Screen 032 — New Lead Capture: GPS & Site Photo. Real device GPS, real
 * camera capture, and a guided photo set — the tamper-resistant foundation
 * every later duplicate check and fraud signal in the app relies on.
 */
export function CaptureGpsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useCaptureGps();

  return (
    <Screen width="narrow" className="pb-action-bar">
      <div className="mt-4">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      </div>
      <CaptureStepRail current="location" />

      {s.isOffline && (
        <Card className="mb-3">
          <p className="t-sm t-warning row gap-2">
            <WifiSlash size={16} className="shrink-0" />
            {t(K.offlineQueued)}
          </p>
        </Card>
      )}

      <Card className="mb-4">
        <div className="row gap-3">
          <MapPinLine size={22} className="t-emerald shrink-0" />
          <div className="grow stack gap-2">
            {s.phase === 'locating' && <p className="t-sm t-muted">{t(K.gps.locating)}</p>}

            {s.phase === 'located' && s.accuracyMetres !== null && (
              <p className="t-sm t-success">
                {s.accuracyMetres === 0
                  ? t(K.gps.manuallyPlaced)
                  : `${t(K.gps.located)} · ${t(K.gps.accuracy, { accuracy: s.accuracyMetres })}`}
              </p>
            )}

            {s.phase === 'poorAccuracy' && s.accuracyMetres !== null && (
              <>
                <p className="t-sm t-warning row gap-2">
                  <Warning size={15} className="shrink-0" />
                  {t(K.gps.poorAccuracy, { accuracy: s.accuracyMetres })}
                </p>
                <p className="t-xs t-muted">{t(K.gps.poorAccuracyAction)}</p>
              </>
            )}

            {s.phase === 'denied' && (
              <>
                <p className="t-sm t-error">{t(K.gps.denied)}</p>
                <p className="t-xs t-muted">{t(K.gps.deniedAction)}</p>
              </>
            )}

            {s.phase === 'unavailable' && <p className="t-sm t-error">{t(K.gps.unavailable)}</p>}

            {(s.phase === 'denied' || s.phase === 'unavailable') && (
              <div>
                <Button size="sm" variant="ghost" onClick={s.locate}>
                  {t(K.gps.retry)}
                </Button>
              </div>
            )}
          </div>
        </div>

        {s.location && (
          <div className="mt-3">
            <MapCanvas
              label={t(K.gps.mapLabel)}
              height={220}
              bounds={{
                minLat: s.location.lat - 0.01,
                maxLat: s.location.lat + 0.01,
                minLng: s.location.lng - 0.01,
                maxLng: s.location.lng + 0.01,
              }}
              markers={[
                {
                  id: 'site',
                  lat: s.location.lat,
                  lng: s.location.lng,
                  tone: s.phase === 'poorAccuracy' ? 'warning' : 'success',
                  label: t(K.gps.located),
                  pulsing: true,
                },
              ]}
              onMapClick={s.phase === 'poorAccuracy' ? s.adjustLocation : undefined}
            />
            {s.phase === 'poorAccuracy' && (
              <p className="t-xs t-muted mt-2">{t(K.gps.manualAdjustNote)}</p>
            )}
          </div>
        )}
      </Card>

      <div className="stack gap-1 mb-3">
        <h2 className="t-md t-semibold row gap-2">
          <Camera size={18} className="t-emerald" />
          {t(K.photos.heading)}
        </h2>
        <p className="t-sm t-muted">{t(K.photos.body)}</p>
      </div>

      <div className="stack gap-3">
        {PHOTO_SLOTS.map((slot) => (
          <DocumentSlot
            key={slot}
            label={t(K.photos.slot[slot])}
            hint={t(K.photos.slotHint[slot])}
            required
            value={s.photos[slot] ?? null}
            onChange={(value) => s.setPhoto(slot, value)}
          />
        ))}
      </div>

      <p className="t-xs t-muted mt-2">
        {t(K.photos.minRequired, { count: s.photoCount, min: PHOTO_SLOTS.length })}
      </p>
      <p className="t-xs t-muted mt-1">{t(K.photos.liveOnlyNote)}</p>
      <p className="t-xs t-muted mt-1">{t(K.photos.geotagNote)}</p>

      <Field label={t(K.landmarkNote.label)} hint={t(K.landmarkNote.hint)}>
        {({ id, describedBy }) => (
          <TextArea
            id={id}
            aria-describedby={describedBy}
            className="mt-4"
            value={s.landmarkNote}
            onChange={(e) => s.setLandmarkNote(e.target.value)}
          />
        )}
      </Field>

      <ActionBar>
        <Badge tone="neutral">1 / 5</Badge>
        <Button className="grow" block disabled={!s.canContinue} onClick={s.continueToNext}>
          {t('action.next')}
        </Button>
      </ActionBar>
    </Screen>
  );
}
