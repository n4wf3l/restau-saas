import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  HeartIcon,
  GiftIcon,
  SpeakerXMarkIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { createReservation, createEventReservation } from '../../lib/api';
import type { ReservationFormData, OccasionType, PublicTable } from '../../lib/types';
import { useAvailabilityCheck } from '../../hooks/useAvailabilityCheck';
import toast from 'react-hot-toast';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

// Occasion labels come from i18n at render time — this is just the icon mapping
const OCCASION_META: Record<OccasionType, { labelKey: string; IconComponent: any }> = {
  romantic:   { labelKey: 'reservation.step4.occasion.romantic',  IconComponent: HeartIcon },
  baby_chair: { labelKey: 'reservation.step4.occasion.babyChair', IconComponent: UserIcon },
  birthday:   { labelKey: 'reservation.step4.occasion.birthday',  IconComponent: GiftIcon },
  quiet:      { labelKey: 'reservation.step4.occasion.quiet',     IconComponent: SpeakerXMarkIcon },
  business:   { labelKey: 'reservation.step4.occasion.business',  IconComponent: BriefcaseIcon },
};

export function ReservationModal({ isOpen, onClose }: ReservationModalProps) {
  const { t } = useTranslation();
  // ─────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<ReservationFormData>({
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    partySize: 2,
    placementMode: 'auto',
    selectedTableId: null,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    occasion: [],
    specialNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [showTableList, setShowTableList] = useState(false);
  const [previewTableId, setPreviewTableId] = useState<number | null>(null);
  
  const { availability, checking, checkAvailability } = useAvailabilityCheck();

  // Reset step when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────
  
  // Check availability quand créneau change
  useEffect(() => {
    if (isOpen) {
      checkAvailability(formData.date, formData.time, formData.partySize);
    }
  }, [formData.date, formData.time, formData.partySize, isOpen, checkAvailability]);

  // Reset selected table si mode auto ou event
  useEffect(() => {
    if (formData.placementMode === 'manual') {
      setShowTableList(true);
    } else {
      setFormData(prev => ({ ...prev, selectedTableId: null }));
      setShowTableList(false);
    }
    if (formData.placementMode !== 'event') {
      setFormData(prev => ({ ...prev, eventDetails: '' }));
    }
  }, [formData.placementMode]);

  // Ajuster partySize si dépasse capacité table sélectionnée
  useEffect(() => {
    if (formData.selectedTableId && availability?.tables) {
      const selectedTable = availability.tables.find(t => t.id === formData.selectedTableId);
      if (selectedTable && formData.partySize > selectedTable.available_seats) {
        setFormData(prev => ({ 
          ...prev, 
          partySize: selectedTable.available_seats 
        }));
        toast(t('reservation.partySizeAdjusted'), { icon: 'ℹ️' });
      }
    }
  }, [formData.selectedTableId, availability, formData.partySize]);

  // ─────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────
  
  const updateField = <K extends keyof ReservationFormData>(field: K, value: ReservationFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleOccasion = (occasion: OccasionType) => {
    setFormData(prev => ({
      ...prev,
      occasion: prev.occasion?.includes(occasion)
        ? prev.occasion.filter(o => o !== occasion)
        : [...(prev.occasion || []), occasion],
    }));
  };

  const getMaxGuests = (): number => {
    if (formData.placementMode === 'manual' && formData.selectedTableId) {
      const table = availability?.tables.find(t => t.id === formData.selectedTableId);
      return table?.available_seats || 20;
    }
    // En mode auto, max = plus grande table dispo
    if (formData.placementMode === 'auto') {
      return availability?.tables.length
        ? Math.max(...availability.tables.map(t => t.available_seats))
        : 20;
    }
    // En mode event, pas de limite de table
    return 200;
  };

  const getAssignedTableName = (): string => {
    if (formData.placementMode === 'manual' && formData.selectedTableId) {
      const table = availability?.tables.find(t => t.id === formData.selectedTableId);
      return table?.name || '—';
    }

    // Best fit algorithm pour auto et event
    if (availability?.tables.length) {
      const suitableTables = availability.tables
        .filter(t => t.available_seats >= formData.partySize)
        .sort((a, b) => a.available_seats - b.available_seats);
      
      return suitableTables[0]?.name || '—';
    }
    
    return '—';
  };

  const canSubmit = (): boolean => {
    const baseValid = !!(
      formData.customerName.trim() &&
      formData.customerEmail.trim() &&
      formData.customerPhone.trim() &&
      !checking &&
      !loading
    );
    if (formData.placementMode === 'event') {
      return baseValid && !!(formData.eventDetails && formData.eventDetails.trim());
    }
    return baseValid && !!availability?.available;
  };

  // Step validation
  const canProceedToStep2 = (): boolean => {
    return !!(
      !checking &&
      formData.partySize >= 1
    );
  };

  const canProceedToStep3 = (): boolean => {
    if (formData.placementMode === 'manual') {
      return !!formData.selectedTableId;
    }
    if (formData.placementMode === 'event') {
      return !!(formData.eventDetails && formData.eventDetails.trim());
    }
    return true; // Auto mode always valid if we reached step 2
  };

  const canProceedToStep4 = (): boolean => {
    return !!(
      formData.customerName.trim() &&
      formData.customerEmail.trim() &&
      formData.customerPhone.trim()
    );
  };

  // Step navigation
  const goToNextStep = () => {
    if (currentStep === 1 && canProceedToStep2()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedToStep3()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && canProceedToStep4()) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit()) {
      return;
    }

    setLoading(true);
    try {
      const arrivalDateTime = `${formData.date} ${formData.time}:00`;

      // ─── Event mode: separate API, no table needed ───
      if (formData.placementMode === 'event') {
        const eventPayload = {
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          arrival_time: arrivalDateTime,
          party_size: formData.partySize,
          notes: [
            ...formData.occasion?.map(o => t(OCCASION_META[o].labelKey)) || [],
            formData.specialNotes,
          ].filter(Boolean).join(' | ') || undefined,
          event_details: formData.eventDetails || '',
        };

        await createEventReservation(eventPayload);
        toast.success(t('reservation.successEvent'), { duration: 5000 });
        onClose();

        setCurrentStep(1);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          time: '19:00',
          partySize: 2,
          placementMode: 'auto',
          selectedTableId: null,
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          occasion: [],
          specialNotes: '',
        });
        return;
      }

      // ─── Normal flow (auto/manual): unchanged ───
      if (!availability || !availability.available) {
        toast.error(t('reservation.errorCheckAvailability'));
        return;
      }

      let tableId = formData.selectedTableId;
      if (formData.placementMode === 'auto') {
        const suitableTables = availability.tables
          .filter(t => t.available_seats >= formData.partySize)
          .sort((a, b) => a.available_seats - b.available_seats);
        tableId = suitableTables[0]?.id || null;
      }

      if (!tableId) {
        toast.error(t('reservation.errorNoTable'));
        return;
      }

      const payload = {
        table_id: tableId,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        arrival_time: arrivalDateTime,
        party_size: formData.partySize,
        notes: [
          ...formData.occasion?.map(o => t(OCCASION_META[o].labelKey)) || [],
          formData.specialNotes,
        ].filter(Boolean).join(' | '),
      };

      await createReservation(payload);
      toast.success(t('reservation.success'));
      onClose();
      
      // Reset form
      setCurrentStep(1);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        partySize: 2,
        placementMode: 'auto',
        selectedTableId: null,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        occasion: [],
        specialNotes: '',
      });
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error(t('reservation.errorTooMany'));
      } else {
        toast.error(error.response?.data?.message || error.response?.data?.error || t('reservation.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // ANIMATION STATE
  // ─────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  const steps = [
    { number: 1, label: t('reservation.steps.slot'),          icon: CalendarDaysIcon },
    { number: 2, label: t('reservation.steps.placement'),     icon: MapPinIcon },
    { number: 3, label: t('reservation.steps.info'),          icon: UserIcon },
    { number: 4, label: t('reservation.steps.options'),       icon: SparklesIcon },
    { number: 5, label: t('reservation.steps.confirmation'),  icon: CheckCircleIcon },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'bg-black/75' : 'bg-black/0'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-coffee-950 rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl border border-cream-400/30 my-4 md:my-8 max-h-[95vh] overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with close button */}
        <div className="sticky top-0 bg-transparent border-b border-cream-400/20 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-display font-bold text-cream-100">{t('reservation.header')}</h2>
          <button onClick={onClose} className="text-cream-400 hover:text-cream-100 transition bg-transparent p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-8 border-b border-cream-400/10 pb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span
                    className={`text-sm font-medium transition-all ${
                      currentStep === step.number ? 'text-cream-100 font-semibold' : 'text-cream-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="h-px flex-1 mx-2 bg-cream-400/10" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          
          {/* ═══════════════════════════════════════════════════ */}
          {/* STEP 1: VOTRE CRÉNEAU */}
          {/* ═══════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <section className="animate-fadeIn">
              <h3 className="text-lg font-display font-semibold text-cream-100 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-cream-400" />
                {t('reservation.step1.title')}
              </h3>

              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-cream-300 mb-2">
                    {t('reservation.step1.dateLabel')}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 focus:ring-1 focus:ring-cream-400 transition cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                </div>

                {/* Heure + Convives */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Heure */}
                  <div>
                    <label className="block text-sm font-medium text-cream-300 mb-2">
                      {t('reservation.step1.timeLabel')}
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => updateField('time', e.target.value)}
                      className="w-full px-4 py-3 bg-coffee-950 border border-cream-400/30 rounded-lg text-cream-100 focus:ring-1 focus:ring-cream-400 transition cursor-pointer [&>option]:bg-coffee-950 [&>option]:text-cream-100 [&>option:disabled]:text-gray-500 [&>option:disabled]:opacity-60 [&>option:disabled]:cursor-not-allowed"
                      style={{ colorScheme: 'dark' }}
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 12).map(hour => {
                        const time = `${hour.toString().padStart(2, '0')}:00`;
                        const now = new Date();
                        const today = now.toISOString().split('T')[0];
                        const currentHour = now.getHours();
                        const isPastHour = formData.date === today && hour <= currentHour;
                        
                        return (
                          <option 
                            key={time} 
                            value={time}
                            disabled={isPastHour}
                          >
                            {time}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Convives */}
                  <div>
                    <label className="block text-sm font-medium text-cream-300 mb-2">
                      {t('reservation.step1.partySizeLabel')}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateField('partySize', Math.max(1, formData.partySize - 1))}
                        className="px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 hover:border-cream-400 active:bg-cream-400/10 transition disabled:opacity-50 min-w-[44px] min-h-[44px]"
                        disabled={formData.partySize <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={formData.partySize}
                        onChange={(e) => updateField('partySize', Math.max(1, Math.min(getMaxGuests(), parseInt(e.target.value) || 1)))}
                        className="flex-1 px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 text-center focus:ring-1 focus:ring-cream-400 transition"
                        min="1"
                        max={getMaxGuests()}
                      />
                      <button
                        type="button"
                        onClick={() => updateField('partySize', Math.min(getMaxGuests(), formData.partySize + 1))}
                        className="px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 hover:border-cream-400 active:bg-cream-400/10 transition disabled:opacity-50 min-w-[44px] min-h-[44px]"
                        disabled={formData.partySize >= getMaxGuests()}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Feedback disponibilité */}
                <AvailabilityFeedback 
                  availability={availability}
                  checking={checking}
                  formData={formData}
                  onTimeChange={(time) => updateField('time', time)}
                />
              </div>

              {/* Navigation Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!canProceedToStep2()}
                  className="px-6 py-3.5 bg-coffee-600 hover:bg-coffee-500 active:bg-coffee-700 disabled:opacity-30 disabled:cursor-not-allowed text-cream-50 font-bold rounded-lg transition flex items-center gap-2 min-h-[48px]"
                >
                  {t('common.next')}
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* STEP 2: PLACEMENT */}
          {/* ═══════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <section className="animate-fadeIn">
              <h3 className="text-lg font-display font-semibold text-cream-100 mb-4 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-cream-400" />
                {t('reservation.step2.title')}
              </h3>

              {(() => {
                const hasAvailableTables = !!(availability?.available && availability.tables.some(t => t.available_seats >= formData.partySize));
                return (
              <div className="space-y-3">
                {/* Option Auto */}
                <label className={`flex items-start gap-3 p-4 bg-transparent rounded-lg border transition ${
                  !hasAvailableTables ? 'opacity-40 cursor-not-allowed border-cream-400/20' :
                  formData.placementMode === 'auto' ? 'border-cream-400 cursor-pointer' : 'border-cream-400/30 cursor-pointer hover:border-cream-400'
                }`}>
                  <input
                    type="radio"
                    name="placement"
                    value="auto"
                    checked={formData.placementMode === 'auto'}
                    onChange={() => updateField('placementMode', 'auto')}
                    disabled={!hasAvailableTables}
                    className="mt-1 w-4 h-4 text-cream-400 focus:ring-cream-400"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-cream-100">{t('reservation.step2.autoLabel')}</div>
                    <div className="text-sm text-cream-400 mt-1">
                      {hasAvailableTables ? t('reservation.step2.autoAvailable') : t('reservation.step2.autoUnavailable')}
                    </div>
                  </div>
                </label>

                {/* Option Manuel */}
                <label className={`flex items-start gap-3 p-4 bg-transparent rounded-lg border transition ${
                  !hasAvailableTables ? 'opacity-40 cursor-not-allowed border-cream-400/20' :
                  formData.placementMode === 'manual' ? 'border-cream-400 cursor-pointer' : 'border-cream-400/30 cursor-pointer hover:border-cream-400'
                }`}>
                  <input
                    type="radio"
                    name="placement"
                    value="manual"
                    checked={formData.placementMode === 'manual'}
                    onChange={() => updateField('placementMode', 'manual')}
                    disabled={!hasAvailableTables}
                    className="mt-1 w-4 h-4 text-cream-400 focus:ring-cream-400"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-cream-100">{t('reservation.step2.manualLabel')}</div>
                    <div className="text-sm text-cream-400 mt-1">
                      {hasAvailableTables ? t('reservation.step2.manualAvailable') : t('reservation.step2.manualUnavailable')}
                    </div>
                  </div>
                </label>

                {/* Option Événement */}
                <label className={`flex items-start gap-3 p-4 bg-transparent rounded-lg border cursor-pointer hover:border-cream-400 transition ${
                  formData.placementMode === 'event' ? 'border-cream-400' : 'border-cream-400/30'
                }`}>
                  <input
                    type="radio"
                    name="placement"
                    value="event"
                    checked={formData.placementMode === 'event'}
                    onChange={() => updateField('placementMode', 'event')}
                    className="mt-1 w-4 h-4 text-cream-400 focus:ring-cream-400"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-cream-100">{t('reservation.step2.eventLabel')}</div>
                    <div className="text-sm text-cream-400 mt-1">
                      Pour les groupes de 4+ personnes, on s'occupe du placement
                    </div>
                  </div>
                </label>

                {/* Textarea événement */}
                {formData.placementMode === 'event' && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium text-cream-300 mb-2">
                      {t('reservation.step2.eventTextareaLabel')}
                    </label>
                    <textarea
                      value={formData.eventDetails || ''}
                      onChange={(e) => updateField('eventDetails', e.target.value)}
                      className="w-full px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 placeholder-cream-500 focus:ring-1 focus:ring-cream-400 transition resize-none"
                      rows={3}
                      placeholder={t('reservation.step2.eventPlaceholder')}
                      required
                    />
                  </div>
                )}

                {/* Liste tables si manuel */}
                {showTableList && availability?.tables && (() => {
                  const suitableTables = availability!.tables.filter(t => t.available_seats >= formData.partySize);
                  const previewTable = suitableTables.find(t => t.id === previewTableId);

                  return (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {suitableTables.map(table => (
                          <div
                            key={table.id}
                            className={`w-full p-3 rounded-lg text-left transition ${
                              formData.selectedTableId === table.id
                                ? 'bg-coffee-600 text-cream-50 border border-cream-400'
                                : 'bg-transparent text-cream-100 border border-cream-400/30 hover:border-cream-400'
                            }`}
                          >
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => updateField('selectedTableId', table.id)}>
                              <div>
                                <div className="font-semibold">{table.name}</div>
                                <div className="text-xs opacity-75 mt-0.5">{table.floor} &middot; {table.total_seats} places</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPreviewTableId(previewTableId === table.id ? null : table.id); }}
                                  className="text-[10px] px-2 py-0.5 border border-cream-400/30 rounded text-cream-400/70 hover:text-cream-200 hover:border-cream-400/60 bg-transparent transition whitespace-nowrap"
                                >
                                  {previewTableId === table.id ? t('reservation.step2.hideOnPlan') : t('reservation.step2.showOnPlan')}
                                </button>
                                <span className="text-sm opacity-75">
                                  {table.available_seats} {t('reservation.step2.availableShort')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mini floor plan preview */}
                      {previewTable && (
                        <MiniTablePreview table={previewTable} allTables={suitableTables} />
                      )}
                    </div>
                  );
                })()}
              </div>
                );
              })()}

              {/* Navigation Buttons */}
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="px-6 py-3.5 bg-transparent border border-cream-400/30 hover:border-cream-400 active:bg-cream-400/10 text-cream-100 font-bold rounded-lg transition flex items-center gap-2 min-h-[48px]"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!canProceedToStep3()}
                  className="px-6 py-3.5 bg-coffee-600 hover:bg-coffee-500 active:bg-coffee-700 disabled:opacity-30 disabled:cursor-not-allowed text-cream-50 font-bold rounded-lg transition flex items-center gap-2 min-h-[48px]"
                >
                  {t('common.next')}
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* STEP 3: VOS INFORMATIONS */}
          {/* ═══════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <section className="animate-fadeIn">
              <h3 className="text-lg font-display font-semibold text-cream-100 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-cream-400" />
                {t('reservation.step3.title')}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cream-300 mb-2">
                    {t('reservation.step3.fullNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => updateField('customerName', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 placeholder-cream-500 focus:ring-1 focus:ring-cream-400 transition"
                    placeholder={t('reservation.step3.fullNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cream-300 mb-2">
                    {t('reservation.step3.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => updateField('customerEmail', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 placeholder-cream-500 focus:ring-1 focus:ring-cream-400 transition"
                    placeholder={t('reservation.step3.emailPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cream-300 mb-2">
                    {t('reservation.step3.phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => updateField('customerPhone', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 placeholder-cream-500 focus:ring-1 focus:ring-cream-400 transition"
                    placeholder={t('reservation.step3.phonePlaceholder')}
                    required
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="px-6 py-3.5 bg-transparent border border-cream-400/30 hover:border-cream-400 active:bg-cream-400/10 text-cream-100 font-bold rounded-lg transition flex items-center gap-2 min-h-[48px]"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!canProceedToStep4()}
                  className="px-6 py-3.5 bg-coffee-600 hover:bg-coffee-500 active:bg-coffee-700 disabled:opacity-30 disabled:cursor-not-allowed text-cream-50 font-bold rounded-lg transition flex items-center gap-2 min-h-[48px]"
                >
                  {t('common.next')}
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* STEP 4: DEMANDES SPÉCIALES */}
          {/* ═══════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <section className="animate-fadeIn">
              <h3 className="text-lg font-display font-semibold text-cream-100 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-cream-400" />
                {t('reservation.step4.title')}
              </h3>

              {/* Occasion chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(Object.keys(OCCASION_META) as OccasionType[]).map(occasion => {
                  const { IconComponent, labelKey } = OCCASION_META[occasion];
                  const label = t(labelKey);
                  const isSelected = formData.occasion?.includes(occasion);
                  return (
                    <button
                      key={occasion}
                      type="button"
                      onClick={() => toggleOccasion(occasion)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition flex items-center gap-2 min-h-[44px] ${
                        isSelected
                          ? 'bg-coffee-600 text-cream-50 border border-cream-400'
                          : 'bg-transparent text-cream-300 border border-cream-400/30 hover:border-cream-400 active:bg-cream-400/10'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-cream-300 mb-2">
                  {t('reservation.step4.notesLabel')}
                </label>
                <textarea
                  value={formData.specialNotes}
                  onChange={(e) => updateField('specialNotes', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-cream-400/30 rounded-lg text-cream-100 placeholder-cream-500 focus:ring-1 focus:ring-cream-400 transition resize-none"
                  rows={3}
                  placeholder={t('reservation.step4.notesPlaceholder')}
                />
              </div>

              {/* Navigation Buttons */}
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="px-6 py-3.5 bg-transparent border border-cream-400/30 hover:border-cream-400 active:bg-cream-400/10 text-cream-100 font-bold rounded-lg transition flex items-center gap-2 min-h-[48px]"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-6 py-3.5 bg-coffee-600 hover:bg-coffee-500 active:bg-coffee-700 text-cream-50 font-bold rounded-lg transition flex items-center gap-2 min-h-[48px]"
                >
                  {t('common.next')}
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* STEP 5: CONFIRMATION */}
          {/* ═══════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <section className="space-y-6 animate-fadeIn">
              {/* Résumé */}
              <div className="border border-cream-400/30 rounded-lg p-6">
                <h3 className="text-xl font-display font-bold text-cream-100 mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-cream-400" />
                  {t('reservation.step5.title')}
                </h3>
                <div className="space-y-3 text-cream-200">
                  <div className="flex items-start gap-3">
                    <CalendarDaysIcon className="w-5 h-5 text-cream-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-cream-100">{t('reservation.step5.dateTime')}</div>
                      <div>{new Date(formData.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à {formData.time}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-5 h-5 text-cream-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-cream-100">{t('reservation.step5.guests')}</div>
                      <div>{formData.partySize} personne{formData.partySize > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-cream-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-cream-100">
                        {formData.placementMode === 'event' ? t('reservation.step5.tableEvent') : t('reservation.step5.table')}
                      </div>
                      {formData.placementMode === 'event' ? (
                        <div className="text-cream-300">{t('reservation.step5.tableEventNote')}</div>
                      ) : (
                        <div>{getAssignedTableName()} ({formData.placementMode === 'auto' ? t('reservation.step5.tableAuto') : t('reservation.step5.tableManual')})</div>
                      )}
                      {formData.placementMode === 'event' && formData.eventDetails && (
                        <div className="text-sm text-cream-400 mt-1 italic">« {formData.eventDetails} »</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-5 h-5 text-cream-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-cream-100">{t('reservation.step5.contact')}</div>
                      <div>{formData.customerName}</div>
                      <div className="text-sm">{formData.customerEmail}</div>
                      <div className="text-sm">{formData.customerPhone}</div>
                    </div>
                  </div>
                  {(formData.occasion && formData.occasion.length > 0) || formData.specialNotes ? (
                    <div className="flex items-start gap-3">
                      <SparklesIcon className="w-5 h-5 text-cream-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-cream-100">{t('reservation.step5.special')}</div>
                        {formData.occasion && formData.occasion.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.occasion.map(occ => (
                              <span key={occ} className="text-xs bg-coffee-500/30 px-2 py-0.5 rounded">
                                {t(OCCASION_META[occ].labelKey)}
                              </span>
                            ))}
                          </div>
                        )}
                        {formData.specialNotes && (
                          <div className="text-sm mt-1">{formData.specialNotes}</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Info message */}
              {formData.placementMode === 'event' ? (
                <div className="border border-violet-400/30 bg-violet-500/[0.06] rounded-lg p-4 space-y-2">
                  <p className="text-violet-300 text-sm font-semibold">{t('reservation.step5.eventInfoTitle')}</p>
                  <p className="text-cream-400 text-sm">
                    Aucune table n'est réservée automatiquement. Le restaurant vous contactera pour organiser le placement et confirmer les détails.
                  </p>
                </div>
              ) : (
                <div className="border border-cream-400/30 rounded-lg p-4">
                  <p className="text-cream-300 text-sm" dangerouslySetInnerHTML={{ __html: t('reservation.step5.emailConfirm', { email: `<strong class="text-cream-100">${formData.customerEmail}</strong>` }) }} />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="px-6 py-3.5 bg-transparent border border-cream-400/30 hover:border-cream-400 active:bg-cream-400/10 text-cream-100 font-bold rounded-lg transition flex items-center gap-2 min-h-[48px]"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  {t('common.back')}
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit()}
                  className="px-8 py-4 bg-coffee-600 hover:bg-coffee-500 disabled:opacity-30 disabled:cursor-not-allowed text-cream-50 font-bold rounded-lg transition text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <ClockIcon className="animate-spin w-6 h-6" />
                      {formData.placementMode === 'event' ? t('reservation.step5.submitEventSending') : t('reservation.step5.submitRegularSending')}
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-6 h-6" />
                      {formData.placementMode === 'event' ? t('reservation.step5.submitEventButton') : t('reservation.step5.submitRegularButton')}
                    </>
                  )}
                </button>
              </div>
            </section>
          )}
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// COMPOSANT: Mini Floor Plan Preview
// ─────────────────────────────────────────────────────────
interface MiniTablePreviewProps {
  table: PublicTable;
  allTables: PublicTable[];
}

function MiniTablePreview({ table, allTables }: MiniTablePreviewProps) {
  // Filter tables on the same floor
  const sameFlorTables = allTables.filter(t => t.floor === table.floor);

  // Compute bounding box with padding
  const xs = sameFlorTables.map(t => t.x);
  const ys = sameFlorTables.map(t => t.y);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minY = Math.min(...ys) - 1;
  const maxY = Math.max(...ys) + 1;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return (
    <div className="border border-cream-400/20 rounded-lg p-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-cream-400 tracking-wider uppercase font-body">
          {table.floor}
        </span>
        <span className="text-xs text-cream-100 font-semibold">
          {table.name}
        </span>
      </div>

      {/* Mini grid */}
      <div className="relative w-full bg-coffee-950/50 rounded border border-cream-400/10" style={{ aspectRatio: `${rangeX} / ${rangeY}` }}>
        {sameFlorTables.map(t => {
          const left = ((t.x - minX) / rangeX) * 100;
          const top = ((t.y - minY) / rangeY) * 100;
          const isSelected = t.id === table.id;

          return (
            <div
              key={t.id}
              className={`absolute w-3 h-3 rounded-sm -translate-x-1/2 -translate-y-1/2 transition-all ${
                isSelected
                  ? 'bg-cream-300 ring-2 ring-cream-400 scale-150'
                  : 'bg-cream-400/25'
              }`}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={t.name}
            />
          );
        })}
      </div>

      <div className="mt-2 text-center text-[10px] text-cream-400/50 font-body">
        Position de votre table sur le plan
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// COMPOSANT: Feedback Disponibilité
// ─────────────────────────────────────────────────────────
interface AvailabilityFeedbackProps {
  availability: {
    available: boolean;
    tables: PublicTable[];
    suggestedSlots?: Array<{ time: string; availableSeats: number }>;
    message?: string;
  } | null;
  checking: boolean;
  formData: ReservationFormData;
  onTimeChange: (time: string) => void;
}

function AvailabilityFeedback({
  availability,
  checking,
  formData,
  onTimeChange
}: AvailabilityFeedbackProps) {
  const { t } = useTranslation();
  if (checking) {
    return (
      <div className="flex items-center gap-2 text-cream-400 text-sm bg-transparent rounded-lg p-3 border border-cream-400/30">
        <ClockIcon className="animate-spin h-5 w-5 text-cream-400" />
        {t('reservation.step1.checking')}
      </div>
    );
  }

  if (!availability) return null;

  if (availability.available && availability.tables.length > 0) {
    const suitableTables = availability.tables.filter(
      t => t.available_seats >= formData.partySize
    );

    if (suitableTables.length === 0) {
      return (
        <div className="bg-transparent border border-cream-400/30 rounded-lg p-3">
          <div className="text-cream-400 text-sm font-medium flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 flex-shrink-0" />
            {t('reservation.step1.noTables', { count: formData.partySize })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-transparent border border-cream-400/30 rounded-lg p-3">
        <div className="text-cream-300 text-sm flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 flex-shrink-0 text-cream-400" />
          <span>{t('reservation.step1.available', { count: suitableTables.length, guests: formData.partySize })}</span>
        </div>
        <div className="text-cream-400 text-xs mt-1">
          {suitableTables.slice(0, 3).map(t => t.name).join(', ')}
          {suitableTables.length > 3 && ` et ${suitableTables.length - 3} autre${suitableTables.length - 3 > 1 ? 's' : ''}`}
        </div>
      </div>
    );
  }

  // Indisponible avec suggestions
  return (
    <div className="bg-transparent border border-cream-400/30 rounded-lg p-3 space-y-2">
      <div className="text-cream-400 text-sm font-medium flex items-center gap-2">
        <XCircleIcon className="w-5 h-5 flex-shrink-0" />
        {t('reservation.noSlots', { time: formData.time })}
      </div>
      {availability.suggestedSlots && availability.suggestedSlots.length > 0 && (
        <div className="text-cream-400 text-xs">
          <div className="font-medium mb-1">{t('reservation.suggestedSlots')}</div>
          <div className="flex flex-wrap gap-1">
            {availability.suggestedSlots.map(slot => (
              <button
                key={slot.time}
                type="button"
                onClick={() => onTimeChange(slot.time)}
                className="px-2 py-1 bg-coffee-600 hover:bg-coffee-500 rounded text-cream-50 text-xs transition"
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
