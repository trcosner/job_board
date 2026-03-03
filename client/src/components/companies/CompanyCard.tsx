import Link from 'next/link';
import Image from 'next/image';
import type { Company } from '@/types/company';
import { ROUTES } from '@/lib/constants';
import styles from './CompanyCard.module.css';

export interface CompanyCardProps {
  company: Pick<Company, 'name' | 'slug' | 'logo_url' | 'location' | 'industry'>;
  className?: string;
}

export function CompanyCard({ company, className }: CompanyCardProps) {
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const subline = [company.industry, company.location].filter(Boolean).join(' · ');

  return (
    <Link
      href={ROUTES.COMPANY(company.slug)}
      className={`${styles.card}${className ? ` ${className}` : ''}`}
    >
      {company.logo_url ? (
        <Image
          src={company.logo_url}
          alt={`${company.name} logo`}
          width={36}
          height={36}
          className={styles.logoImage}
        />
      ) : (
        <div className={styles.logoPlaceholder} aria-hidden="true">
          {initials}
        </div>
      )}

      <div className={styles.info}>
        <p className={styles.name}>{company.name}</p>
        {subline && <p className={styles.sub}>{subline}</p>}
      </div>
    </Link>
  );
}
