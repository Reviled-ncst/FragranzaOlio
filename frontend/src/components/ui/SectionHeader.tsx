import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  children?: ReactNode;
  className?: string;
  dark?: boolean;
}

const SectionHeader = ({
  title,
  subtitle,
  align = 'center',
  children,
  className,
  dark = false,
}: SectionHeaderProps) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={clsx('mb-12', alignmentClasses[align], className)}>
      <h2 
        className={clsx(
          'font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4',
          dark ? 'text-white' : 'text-charcoal'
        )} 
        data-aos="fade-up"
      >
        {title}
      </h2>
      <div 
        className={clsx(
          'divider my-4',
          align === 'left' && 'divider-left',
          align === 'right' && 'ml-auto mr-0'
        )} 
        data-aos="fade-up" 
        data-aos-delay="100"
      />
      {subtitle && (
        <p 
          className={clsx(
            'text-lg md:text-xl max-w-2xl',
            dark ? 'text-gray-300' : 'text-gray-600',
            align === 'center' && 'mx-auto',
            align === 'right' && 'ml-auto'
          )}
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
};

export default SectionHeader;
