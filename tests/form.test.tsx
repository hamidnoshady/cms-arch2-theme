// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CmsForm } from '@/components/forms/CmsForm'
import type { FormDoc } from '@/lib/cms/types'

/**
 * The CMS-defined form's client behaviour.
 *
 * These are the promises the brief makes to a visitor: required fields are enforced with
 * visible, announced errors; the honeypot is invisible and silently absorbs a bot without
 * writing anything; a recoverable failure keeps what was typed; and a success is announced
 * rather than silently swapped in. The end-to-end version of this (a real browser against a
 * real server, including the double-submit guard) lives in `scripts/interaction-audit.mjs`.
 */

const form: FormDoc = {
  fields: [
    { fieldType: 'text', id: 'f-name', label: 'نام', name: 'name', required: true },
    { fieldType: 'email', id: 'f-email', label: 'ایمیل', name: 'email', required: true },
    { fieldType: 'textarea', id: 'f-message', label: 'پیام', name: 'message', required: true },
    { fieldType: 'checkbox', id: 'f-consent', label: 'موافقم', name: 'consent', required: true },
  ],
  id: 'form-contact',
  submitButtonLabel: 'ارسال',
  title: 'فرم تماس',
}

const posts: { body?: unknown; url: string }[] = []

beforeEach(() => {
  posts.length = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      posts.push({ body: init?.body, url: String(url) })
      return new Response('{"message":"submitted"}', {
        headers: { 'content-type': 'application/json' },
        status: 201,
      })
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const fill = (container: HTMLElement, values: Record<string, string>) => {
  for (const [name, value] of Object.entries(values)) {
    fireEvent.change(container.querySelector(`[name="${name}"]`) as Element, { target: { value } })
  }
}

const consent = (container: HTMLElement) => fireEvent.click(container.querySelector('[name="consent"]') as Element)

describe('required-field validation', () => {
  it('marks every empty required field invalid and posts nothing', async () => {
    const { container } = render(<CmsForm form={form} locale="fa" />)
    fireEvent.submit(container.querySelector('form') as Element)

    await waitFor(() => expect(container.querySelectorAll('[aria-invalid="true"]')).toHaveLength(4))
    expect(posts).toHaveLength(0)
    // The error is tied to its control so a screen reader announces it on focus.
    const field = container.querySelector('[name="name"]') as Element
    const describedBy = field.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(container.querySelector(`#${CSS.escape(describedBy as string)}`)?.textContent).toContain('الزامی')
  })

  it('clears a field error as soon as the visitor types in it', async () => {
    const { container } = render(<CmsForm form={form} locale="fa" />)
    fireEvent.submit(container.querySelector('form') as Element)
    await waitFor(() => expect(container.querySelectorAll('[aria-invalid="true"]')).toHaveLength(4))

    fill(container, { name: 'نمونه' })
    await waitFor(() => expect(container.querySelectorAll('[aria-invalid="true"]')).toHaveLength(3))
  })

  it('refuses a consent checkbox that was not ticked', async () => {
    const { container } = render(<CmsForm form={form} locale="en" />)
    fill(container, { email: 'a@example.com', message: 'hi', name: 'x' })
    fireEvent.submit(container.querySelector('form') as Element)

    await waitFor(() => expect(container.querySelector('[name="consent"]')?.getAttribute('aria-invalid')).toBe('true'))
    expect(posts).toHaveLength(0)
  })
})

describe('submission', () => {
  const complete = async (container: HTMLElement) => {
    fill(container, { email: 'a@example.com', message: 'سلام', name: 'نمونه' })
    consent(container)
    fireEvent.submit(container.querySelector('form') as Element)
  }

  it('posts the CMS field names and values, then announces success', async () => {
    const { container } = render(<CmsForm form={form} locale="fa" />)
    await complete(container)

    await waitFor(() => expect(posts).toHaveLength(1))
    expect(posts[0]!.url).toBe('/api/form-submissions')
    const body = JSON.parse(String(posts[0]!.body)) as { form: string; submissionData: { field: string; value: string }[] }
    expect(body.form).toBe('form-contact')
    expect(body.submissionData).toEqual(
      expect.arrayContaining([
        { field: 'name', value: 'نمونه' },
        { field: 'email', value: 'a@example.com' },
        // A boolean becomes a string: the CMS field is text, not a checkbox.
        { field: 'consent', value: 'true' },
      ]),
    )

    const live = await screen.findByText('پیام شما ثبت شد.')
    expect(live.closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('keeps what was typed when the CMS rejects the submission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"errors":[]}', { status: 500 })),
    )
    const { container } = render(<CmsForm form={form} locale="fa" />)
    await complete(container)

    expect(await screen.findByText(/ارسال فرم انجام نشد/)).not.toBeNull()
    expect((container.querySelector('[name="email"]') as HTMLInputElement).value).toBe('a@example.com')
    expect((container.querySelector('[name="message"]') as HTMLTextAreaElement).value).toBe('سلام')
  })

  it('disables the submit control while the request is in flight', async () => {
    let release: (value: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => {
        release = resolve
      })),
    )
    const { container } = render(<CmsForm form={form} locale="fa" />)
    await complete(container)

    await waitFor(() => expect((container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true))
    release(new Response('{}', { status: 201 }))
    await waitFor(() => expect(screen.getByText('پیام شما ثبت شد.')).toBeTruthy())
  })
})

describe('honeypot', () => {
  it('is hidden, unreachable by keyboard and unannounced', () => {
    const { container } = render(<CmsForm form={form} locale="fa" />)
    const trap = container.querySelector('[name="company"]') as HTMLInputElement
    expect(trap).not.toBeNull()
    expect(trap.tabIndex).toBe(-1)
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(trap.closest('.hidden')).not.toBeNull()
    // Never required: a human must not be blocked by a field they cannot see.
    expect(trap.required).toBe(false)
  })

  it('absorbs a bot without writing anything to the CMS', async () => {
    const { container } = render(<CmsForm form={form} locale="fa" />)
    await (async () => {
      fill(container, { email: 'bot@example.com', message: 'spam', name: 'bot' })
      consent(container)
      fill(container, { company: 'filled by a bot' })
      fireEvent.submit(container.querySelector('form') as Element)
    })()

    expect(await screen.findByText('پیام شما ثبت شد.')).toBeTruthy()
    expect(posts).toHaveLength(0)
  })
})
