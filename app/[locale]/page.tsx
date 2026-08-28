import { notFound } from 'next/navigation';
import VeyitSite from '../VeyitSite';
import { copy, Locale } from '../copy';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'hi' }];
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'en' && locale !== 'hi') notFound();
  return <VeyitSite text={copy[locale as Locale]} />;
}
