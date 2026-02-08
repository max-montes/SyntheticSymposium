import { resolveBackendUrl } from '../api/client'

interface ThinkerAvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function ThinkerAvatar({ name, imageUrl, size = 'md' }: ThinkerAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-28 h-28 text-4xl',
  }

  const resolvedUrl = resolveBackendUrl(imageUrl)

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={name}
        className={`${sizeClasses[size].split(' ').slice(0, 2).join(' ')} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center shrink-0`}
      style={{ backgroundColor: 'var(--color-avatar-bg)' }}
    >
      <span className="font-bold" style={{ color: 'var(--color-avatar-text)' }}>
        {name.charAt(0)}
      </span>
    </div>
  )
}
