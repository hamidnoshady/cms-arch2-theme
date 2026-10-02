import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn('field__control', className)} {...props} />
)

export const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn('field__control', className)} {...props} />
)

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('field__label', className)} {...props} />
)
