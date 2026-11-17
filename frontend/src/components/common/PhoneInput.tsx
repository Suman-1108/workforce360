import React, { useState, useEffect, useMemo, forwardRef } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Phone as PhoneIcon,
  Globe,
  Building2,
  Info,
} from 'lucide-react'
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  AsYouType,
  type CountryCode,
} from 'libphonenumber-js/max'

export interface PhoneMetadata {
  raw: string
  isValid: boolean
  isPossible: boolean
  country: CountryCode
  countryName: string
  callingCode: string
  nationalNumber: string
  internationalFormat: string
  e164: string
  type: 'MOBILE' | 'FIXED_LINE' | 'FIXED_LINE_OR_MOBILE' | 'TOLL_FREE' | 'VOIP' | 'OTHER' | 'UNKNOWN'
  typeLabel: string
}

export interface PhoneInputProps {
  label?: string
  value?: string
  defaultValue?: string
  defaultCountry?: CountryCode
  onChange?: (value: string, meta: PhoneMetadata) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  placeholder?: string
  showTypeBadge?: boolean
}

// Convert 2-letter ISO code to native emoji flag
export const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🌐'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Fast timezone-to-country resolver
const TIMEZONE_TO_COUNTRY: Record<string, CountryCode> = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
  'Europe/London': 'GB',
  'Asia/Colombo': 'LK',
  'Asia/Dubai': 'AE',
  'Australia/Sydney': 'AU',
  'Asia/Singapore': 'SG',
  'Europe/Berlin': 'DE',
  'Asia/Riyadh': 'SA',
  'Europe/Paris': 'FR',
  'Asia/Tokyo': 'JP',
}

const detectInitialCountry = (): CountryCode => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz]
    }
    const lang = navigator.language || ''
    const parts = lang.split('-')
    if (parts.length > 1) {
      const region = parts[1].toUpperCase() as CountryCode
      if (getCountries().includes(region)) return region
    }
  } catch {
    // ignore
  }
  return 'IN'
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      value,
      defaultValue,
      defaultCountry,
      onChange,
      error,
      helperText,
      required,
      disabled,
      id,
      name,
      className = '',
      placeholder,
      showTypeBadge = true,
    },
    ref
  ) => {
    const regionNames = useMemo(() => {
      try {
        return new Intl.DisplayNames(['en'], { type: 'region' })
      } catch {
        return null
      }
    }, [])

    const fallbackCountry = useMemo<CountryCode>(() => {
      if (defaultCountry) return defaultCountry
      return detectInitialCountry()
    }, [defaultCountry])

    // Internal input value
    const [displayValue, setDisplayValue] = useState<string>(() => {
      const initial = value || defaultValue || ''
      if (!initial) return ''
      const ayt = new AsYouType(fallbackCountry)
      return ayt.input(initial)
    })

    // Detect country, line type, and validation from typed string
    const analysis = useMemo(() => {
      const trimmed = displayValue.trim()
      const fallbackCallingCode = '+' + getCountryCallingCode(fallbackCountry)

      if (!trimmed) {
        return {
          country: fallbackCountry,
          countryName: regionNames?.of(fallbackCountry) || 'India',
          callingCode: fallbackCallingCode,
          flag: getCountryFlag(fallbackCountry),
          formatted: '',
          international: '',
          e164: '',
          national: '',
          isValid: false,
          isPossible: false,
          type: 'UNKNOWN' as PhoneMetadata['type'],
          typeLabel: 'Mobile',
          digitCount: 0,
        }
      }

      // If user typed starting with '+'
      if (trimmed.startsWith('+')) {
        const ayt = new AsYouType()
        const formatted = ayt.input(trimmed)
        const detected = ayt.getCountry() || fallbackCountry
        const parsed = parsePhoneNumberFromString(trimmed)
        const cCode = parsed?.country || detected
        const callingCode = parsed?.countryCallingCode
          ? `+${parsed.countryCallingCode}`
          : ayt.getCallingCode()
          ? `+${ayt.getCallingCode()}`
          : fallbackCallingCode

        const rawType = parsed?.getType()
        let type: PhoneMetadata['type'] = 'UNKNOWN'
        let typeLabel = 'Mobile'
        if (rawType === 'MOBILE') {
          type = 'MOBILE'
          typeLabel = 'Mobile'
        } else if (rawType === 'FIXED_LINE') {
          type = 'FIXED_LINE'
          typeLabel = 'Landline'
        } else if (rawType === 'FIXED_LINE_OR_MOBILE') {
          type = 'FIXED_LINE_OR_MOBILE'
          typeLabel = 'Mobile / Landline'
        } else if (rawType === 'TOLL_FREE') {
          type = 'TOLL_FREE'
          typeLabel = 'Toll-Free'
        } else if (rawType === 'VOIP') {
          type = 'VOIP'
          typeLabel = 'VoIP'
        }

        const digits = trimmed.replace(/\D/g, '')

        return {
          country: cCode,
          countryName: regionNames?.of(cCode) || cCode,
          callingCode,
          flag: getCountryFlag(cCode),
          formatted,
          international: parsed?.formatInternational() || formatted,
          e164: parsed?.number || `+${digits}`,
          national: parsed?.formatNational() || formatted,
          isValid: Boolean(parsed?.isValid()),
          isPossible: Boolean(parsed?.isPossible()),
          type,
          typeLabel,
          digitCount: digits.length,
        }
      }

      // If user typed without '+', first check if it's an international number without '+'
      const checkWithPlus = parsePhoneNumberFromString('+' + trimmed)
      if (checkWithPlus && checkWithPlus.isValid()) {
        const cCode = checkWithPlus.country || fallbackCountry
        const callingCode = `+${checkWithPlus.countryCallingCode}`
        const rawType = checkWithPlus.getType()
        let type: PhoneMetadata['type'] = 'UNKNOWN'
        let typeLabel = 'Mobile'
        if (rawType === 'MOBILE') {
          type = 'MOBILE'
          typeLabel = 'Mobile'
        } else if (rawType === 'FIXED_LINE') {
          type = 'FIXED_LINE'
          typeLabel = 'Landline'
        } else if (rawType === 'FIXED_LINE_OR_MOBILE') {
          type = 'FIXED_LINE_OR_MOBILE'
          typeLabel = 'Mobile / Landline'
        }

        return {
          country: cCode,
          countryName: regionNames?.of(cCode) || cCode,
          callingCode,
          flag: getCountryFlag(cCode),
          formatted: checkWithPlus.formatInternational(),
          international: checkWithPlus.formatInternational(),
          e164: checkWithPlus.number,
          national: checkWithPlus.formatNational(),
          isValid: true,
          isPossible: true,
          type,
          typeLabel,
          digitCount: trimmed.replace(/\D/g, '').length,
        }
      }

      // Default country national number
      const ayt = new AsYouType(fallbackCountry)
      const formatted = ayt.input(trimmed)
      const parsed = parsePhoneNumberFromString(trimmed, fallbackCountry)
      const cCode = parsed?.country || fallbackCountry
      const rawType = parsed?.getType()

      let type: PhoneMetadata['type'] = 'UNKNOWN'
      let typeLabel = 'Mobile'
      if (rawType === 'MOBILE') {
        type = 'MOBILE'
        typeLabel = 'Mobile'
      } else if (rawType === 'FIXED_LINE') {
        type = 'FIXED_LINE'
        typeLabel = 'Landline'
      } else if (rawType === 'FIXED_LINE_OR_MOBILE') {
        type = 'FIXED_LINE_OR_MOBILE'
        typeLabel = 'Mobile / Landline'
      }

      const digits = trimmed.replace(/\D/g, '')

      return {
        country: cCode,
        countryName: regionNames?.of(cCode) || 'India',
        callingCode: fallbackCallingCode,
        flag: getCountryFlag(cCode),
        formatted,
        international: parsed?.formatInternational() || `${fallbackCallingCode} ${formatted}`,
        e164: parsed?.number || `${fallbackCallingCode}${digits}`,
        national: parsed?.formatNational() || formatted,
        isValid: Boolean(parsed?.isValid()),
        isPossible: Boolean(parsed?.isPossible()),
        type,
        typeLabel,
        digitCount: digits.length,
      }
    }, [displayValue, fallbackCountry, regionNames])

    // Sync external value changes
    useEffect(() => {
      if (value !== undefined) {
        if (!value) {
          setDisplayValue('')
        } else if (value !== displayValue && value !== analysis.international) {
          setDisplayValue(value)
        }
      }
    }, [value])

    // Handle keystrokes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value

      // Format as you type
      let formattedVal = inputVal
      if (inputVal.startsWith('+')) {
        const ayt = new AsYouType()
        formattedVal = ayt.input(inputVal)
      } else {
        const ayt = new AsYouType(fallbackCountry)
        formattedVal = ayt.input(inputVal)
      }

      setDisplayValue(formattedVal)

      // Evaluate meta
      const fullIntl = formattedVal.startsWith('+')
        ? formattedVal
        : formattedVal.trim()
        ? `+${getCountryCallingCode(fallbackCountry)} ${formattedVal}`
        : ''

      const parsed = formattedVal.startsWith('+')
        ? parsePhoneNumberFromString(formattedVal)
        : parsePhoneNumberFromString(formattedVal, fallbackCountry)

      const meta: PhoneMetadata = {
        raw: formattedVal,
        isValid: Boolean(parsed?.isValid()),
        isPossible: Boolean(parsed?.isPossible()),
        country: (parsed?.country || analysis.country) as CountryCode,
        countryName: analysis.countryName,
        callingCode: analysis.callingCode,
        nationalNumber: parsed?.formatNational() || formattedVal,
        internationalFormat: parsed?.formatInternational() || fullIntl,
        e164: parsed?.number || fullIntl.replace(/[^\d+]/g, ''),
        type: (parsed?.getType() as any) || analysis.type,
        typeLabel: analysis.typeLabel,
      }

      onChange?.(fullIntl, meta)
    }

    // Clean label so we don't duplicate asterisk
    const cleanLabel = label?.replace(/\s*\*\s*$/, '')
    const inputId = id || (label ? label.toLowerCase().replace(/[^\w-]/g, '-') : 'phone-input')

    // Render Type Icon
    const renderTypeIcon = () => {
      switch (analysis.type) {
        case 'MOBILE':
          return <Smartphone className="h-3 w-3 text-emerald-600" />
        case 'FIXED_LINE':
          return <PhoneIcon className="h-3 w-3 text-blue-600" />
        case 'TOLL_FREE':
          return <Building2 className="h-3 w-3 text-amber-600" />
        case 'VOIP':
          return <Globe className="h-3 w-3 text-purple-600" />
        default:
          return <Smartphone className="h-3 w-3 text-[#78847F]" />
      }
    }

    return (
      <div className={`w-full text-left ${className}`}>
        {/* Label with clean single asterisk */}
        {cleanLabel && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#183B36] mb-1.5 uppercase tracking-wider"
          >
            {cleanLabel} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        {/* Clean Single Input with Live Auto-Detected Country Badge (No Dropdown) */}
        <div
          className={`
            relative flex items-center bg-white border rounded-xl transition duration-150 ease-in-out
            focus-within:ring-2 focus-within:ring-[#075E54]/20 focus-within:border-[#075E54]
            ${disabled ? 'bg-[#F5F7F1] cursor-not-allowed opacity-80' : ''}
            ${
              error
                ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/20'
                : analysis.isValid && displayValue
                ? 'border-emerald-400 hover:border-emerald-500'
                : 'border-[#CBD5C8] hover:border-[#9FB39C]'
            }
          `}
        >
          {/* Automatic Country & Dial Code Indicator (Pure Auto-Detection, No Choose Option) */}
          <div
            title={`Auto-detected country: ${analysis.countryName} (${analysis.callingCode})`}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F8FAF8] border-r border-[#CBD5C8] text-[#183B36] rounded-l-xl select-none shrink-0"
          >
            <span className="text-lg leading-none" role="img" aria-label={analysis.countryName}>
              {analysis.flag}
            </span>
            <span className="text-xs font-bold text-[#183B36] tabular-nums">
              {analysis.callingCode}
            </span>
          </div>

          {/* National / International Phone Number Input */}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="tel"
            disabled={disabled}
            value={displayValue}
            onChange={handleInputChange}
            placeholder={placeholder || 'e.g. 90897 86754 or +91 / +94 / +1'}
            className="w-full bg-transparent text-[#183B36] placeholder-[#A0ACA7] text-sm px-3.5 py-2.5 focus:outline-none"
          />

          {/* Real-time Validation Icon */}
          {displayValue && (
            <div className="pr-3 flex items-center shrink-0">
              {analysis.isValid ? (
                <div title={`Valid ${analysis.typeLabel} number (${analysis.countryName})`}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              ) : analysis.isPossible ? (
                <div title="Formatting in progress">
                  <Info className="h-4 w-4 text-amber-500" />
                </div>
              ) : (
                <div title="Invalid number length or format for detected country">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time Country, Phone Type, and Validation Feedback Badge */}
        {showTypeBadge && displayValue.trim().length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {/* Auto-detected Country Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0F5F2] text-[#183B36] font-medium border border-[#CBD5C8]/50">
              <span>{analysis.flag}</span>
              <span>{analysis.countryName}</span>
              <span className="text-[#78847F]">({analysis.callingCode})</span>
            </span>

            {/* Auto-detected Line Type (Mobile, Landline, VoIP, etc.) */}
            {analysis.type !== 'UNKNOWN' && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                  analysis.type === 'MOBILE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : analysis.type === 'FIXED_LINE'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : analysis.type === 'TOLL_FREE'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                {renderTypeIcon()}
                <span>{analysis.typeLabel}</span>
              </span>
            )}

            {/* Live Validity Badge */}
            {analysis.isValid ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>Valid {analysis.typeLabel}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                <Info className="h-3 w-3 text-amber-600 shrink-0" />
                <span>
                  {analysis.digitCount < 6
                    ? 'Incomplete number'
                    : analysis.country === 'IN' && analysis.digitCount !== 10
                    ? `10 digits expected (${analysis.digitCount} entered)`
                    : 'Check number formatting'}
                </span>
              </span>
            )}
          </div>
        )}

        {/* Error or Helper Message */}
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText && !displayValue ? (
          <p className="mt-1.5 text-xs text-[#78847F]">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput'
export default PhoneInput
