import React from 'react';
import { Search, X } from 'lucide-react';
import { cloudyTokens, uiClasses } from '../../design/tokens';
import { Button } from './Button';

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type' | 'value'
> {
  onChange: (value: string) => void;
  onClear?: () => void;
  value: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', onChange, onClear, placeholder = 'Search...', value, ...props }, ref) => (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 dark:text-carbon-500"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[uiClasses.field, cloudyTokens.focus.ring, 'pl-9 pr-10', className].filter(Boolean).join(' ')}
        {...props}
      />
      {value && (
        <Button
          aria-label="Clear search"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          icon={<X aria-hidden="true" className="h-4 w-4" />}
          onClick={onClear ?? (() => onChange(''))}
          size="icon"
          variant="ghost"
        />
      )}
    </div>
  ),
);

SearchInput.displayName = 'SearchInput';
