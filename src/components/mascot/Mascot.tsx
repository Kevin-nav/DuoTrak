
import Image from 'next/image';
import { cn } from '@/lib/utils';

export const mascotVariants = {
  celebration: 'celebration-mascot.png',
  challenge: 'challenge-mascot.png',
  motivation: 'motivation-mascot.png',
  notification: 'notification-mascot.png',
  progress: 'progress-mascot.png',
  rest: 'rest-or-chill-mascot.png',
  streak: 'streak-mascot.png',
  teamwork: 'teamwork-mascot.png',
};

type MascotVariant = keyof typeof mascotVariants;

interface MascotProps {
  variant: MascotVariant;
  size?: number;
  className?: string;
}

const Mascot = ({ variant, size = 128, className }: MascotProps) => {
  const src = `/mascots/${mascotVariants[variant]}`;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={`${variant} mascot`}
        fill
        className="object-contain filter sepia-[0.2] brightness-[1.05] contrast-[0.95]"
      />
    </div>
  );
};

export default Mascot;
