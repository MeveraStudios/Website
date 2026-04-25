/**
 * LanguageToggle
 *
 * Header dropdown for switching the UI language. Currently only English
 * ships — the picker is rendered as a noop-aware control that stays out of
 * the way until more locales are added in `src/i18n/locales/`.
 */

import { Languages, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SUPPORTED_LOCALES,
  persistLocale,
  type SupportedLocale,
} from '@/i18n';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
};

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const current = i18n.language as SupportedLocale;

  // Hide the control when only one locale is available so the header stays
  // clean. As soon as a second locale is added, the switcher becomes useful.
  if (SUPPORTED_LOCALES.length <= 1) return null;

  const handleSelect = (locale: SupportedLocale) => {
    i18n.changeLanguage(locale);
    persistLocale(locale);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label={t('common.language')}
          title={t('common.language')}
        >
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LOCALES.map(l => (
          <DropdownMenuItem
            key={l}
            onSelect={() => handleSelect(l)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{LOCALE_LABELS[l]}</span>
            {l === current && <Check className="h-4 w-4 opacity-70" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
