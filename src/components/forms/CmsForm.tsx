'use client'

import { useId, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import type { FormDoc, FormField } from '@/lib/cms/types'
import { labels as dictionary } from '@/lib/theme/labels'
import type { Locale } from '@/lib/cms/types'

/**
 * CMS-defined form.
 *
 * The field list, labels and required flags come from the `forms` document — the theme
 * never invents fields and never relaxes a required one. Submissions go to
 * `/api/form-submissions` on this origin (the theme proxies it to the CMS, which
 * derives the tenant from the form document server-side).
 *
 * Accessibility and resilience: visible labels tied with `htmlFor`, `aria-invalid` +
 * `aria-describedby` on errors, `aria-live` for the outcome, values preserved on a
 * recoverable failure, and submission disabled while pending so a double click cannot
 * file two enquiries. The hidden `company` input is a honeypot: bots fill it, humans
 * never see it, and a filled value is silently accepted without writing anything.
 */
export const CmsForm = ({
  className,
  form,
  locale,
}: {
  className?: string
  form: FormDoc
  locale: Locale
}) => {
  const t = dictionary(locale)
  const uid = useId()
  const [values, setValues] = useState<Record<string, boolean | string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'error' | 'idle' | 'pending' | 'success'>('idle')

  const fields = (form.fields ?? []).filter((field) => field.name && field.fieldType !== 'message')
  const messages = (form.fields ?? []).filter((field) => field.fieldType === 'message')

  const setValue = (name: string, value: boolean | string): void => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    for (const field of fields) {
      if (!field.required) continue
      const value = values[field.name]
      const empty = field.fieldType === 'checkbox' ? value !== true : !String(value ?? '').trim()
      if (empty) next[field.name] = locale === 'fa' ? 'این فیلد الزامی است.' : 'This field is required.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (status === 'pending') return
    if (!validate()) return

    // Honeypot: pretend success, write nothing.
    if (String(values.company ?? '').length > 0) {
      setStatus('success')
      return
    }

    setStatus('pending')
    try {
      const response = await fetch('/api/form-submissions', {
        body: JSON.stringify({
          form: form.id,
          submissionData: fields.map((field) => ({
            field: field.name,
            value: normalizeValue(values[field.name]),
          })),
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) throw new Error(String(response.status))
      setStatus('success')
      setValues({})
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div aria-live="polite" className={className}>
        <p className="type-body">{t.formSuccess}</p>
      </div>
    )
  }

  return (
    <form className={className} noValidate onSubmit={onSubmit}>
      <div className="flex flex-col gap-6">
        {messages.map((field) => (
          <p className="type-body" key={field.id ?? field.name}>
            {field.label}
          </p>
        ))}

        {fields.map((field) => (
          <Field
            error={errors[field.name]}
            field={field}
            id={`${uid}-${field.name}`}
            key={field.id ?? field.name}
            locale={locale}
            onChange={(value) => setValue(field.name, value)}
            value={values[field.name]}
          />
        ))}

        {/* honeypot — not announced, not focusable, never required */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor={`${uid}-company`}>Company</label>
          <input
            autoComplete="off"
            id={`${uid}-company`}
            name="company"
            onChange={(event) => setValue('company', event.target.value)}
            tabIndex={-1}
            type="text"
            value={String(values.company ?? '')}
          />
        </div>

        {status === 'error' ? (
          <p aria-live="polite" className="type-error">
            {t.formError}
          </p>
        ) : null}

        <div>
          <Button disabled={status === 'pending'} type="submit">
            {status === 'pending' ? t.formPending : (form.submitButtonLabel ?? t.enter)}
          </Button>
        </div>
      </div>
    </form>
  )
}

const normalizeValue = (value: boolean | string | undefined): string =>
  typeof value === 'boolean' ? String(value) : (value ?? '')

const Field = ({
  error,
  field,
  id,
  locale,
  onChange,
  value,
}: {
  error?: string
  field: FormField
  id: string
  locale: Locale
  onChange: (value: boolean | string) => void
  value: boolean | string | undefined
}) => {
  const label = field.label ?? field.name
  const describedBy = error ? `${id}-error` : undefined
  const required = Boolean(field.required)

  if (field.fieldType === 'checkbox') {
    return (
      <div className="field">
        <div className="flex items-start gap-3">
          <input
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            checked={value === true}
            id={id}
            name={field.name}
            onChange={(event) => onChange(event.target.checked)}
            required={required}
            type="checkbox"
          />
          <label className="field__label field__check-label" htmlFor={id}>
            {label}
          </label>
        </div>
        {error ? (
          <p className="field__error" id={`${id}-error`}>
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {renderControl(field, id, value, onChange, describedBy, Boolean(error), required, locale)}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

const renderControl = (
  field: FormField,
  id: string,
  value: boolean | string | undefined,
  onChange: (value: boolean | string) => void,
  describedBy: string | undefined,
  invalid: boolean,
  required: boolean,
  locale: Locale,
) => {
  const common = {
    'aria-describedby': describedBy,
    'aria-invalid': invalid ? (true as const) : undefined,
    id,
    name: field.name,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    required,
    value: String(value ?? ''),
  }

  switch (field.fieldType) {
    case 'textarea':
      return <textarea {...common} className="field__control" rows={5} />
    case 'email':
      return <input {...common} autoComplete="email" className="field__control" dir="ltr" type="email" />
    case 'number':
      return <input {...common} className="field__control" inputMode="numeric" type="number" />
    case 'select':
      return (
        <select {...common} className="field__control">
          <option value="">{locale === 'fa' ? 'انتخاب کنید' : 'Select…'}</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    // `country`/`state` are plugin fields whose option lists are injected by the CMS
    // admin, not returned by the API; they render as plain text inputs here.
    case 'country':
      return <input {...common} autoComplete="country-name" className="field__control" type="text" />
    case 'state':
      return <input {...common} autoComplete="address-level1" className="field__control" type="text" />
    // `text` is the CMS's catch-all input (Payload has no `tel` field type), so the
    // field *name* decides the browser hints: a phone-like field must not offer to
    // autofill the visitor's name, and its digits need LTR isolation inside an RTL form.
    default: {
      const numeric = /(fax|mobile|phone|postal|tel|zip)/iu.test(field.name)
      return (
        <input
          {...common}
          autoComplete={numeric ? 'tel' : 'on'}
          className="field__control"
          dir={numeric ? 'ltr' : undefined}
          inputMode={numeric ? 'tel' : undefined}
          type="text"
        />
      )
    }
  }
}
