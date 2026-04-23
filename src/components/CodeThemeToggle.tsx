/**
 * CodeThemeToggle
 *
 * Header dropdown (shown only on doc routes) that lets the user pick a global
 * syntax-highlighting theme for every code block across every project.
 *
 * Triggered by a `</>` icon button.
 */

import { Check, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCodeTheme, type CodeThemeId } from '@/components/CodeThemeProvider';

export function CodeThemeToggle({ className }: { className?: string }) {
  const { themeId, setThemeId, themes } = useCodeTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Select code block theme"
          title="Code block theme"
        >
          <Code className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Code block theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={themeId}
          onValueChange={v => setThemeId(v as CodeThemeId)}
        >
          {themes.map(t => (
            <DropdownMenuRadioItem key={t.id} value={t.id} className="cursor-pointer">
              <span className="flex items-center justify-between w-full">
                <span>{t.label}</span>
                {themeId === t.id && <Check className="h-4 w-4 ml-2 opacity-70" />}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
