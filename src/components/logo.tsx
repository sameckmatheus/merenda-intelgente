import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-12 w-12 items-center justify-center',
        className
      )}
    >
      <Image
        src="/logo-seduc.png"
        alt="Logo da Secretaria de Educação de Itapissuma"
        fill
        className="object-contain"
      />
    </div>
  );
}
