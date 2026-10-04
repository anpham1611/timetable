import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AutocompleteOption {
  id: number;
  label: string;
  /** Optional secondary text (e.g. the student's class) for disambiguation. */
  detail?: string;
}

export interface AutocompleteProps {
  query: string;
  onQueryChange: (value: string) => void;
  options: AutocompleteOption[];
  onSelect: (option: AutocompleteOption) => void;
  placeholder?: string;
  /** Shown when the query is non-empty but there are no options. */
  noResultsLabel?: ReactNode;
  /** Minimum query length before the results list is shown. */
  minQueryLength?: number;
  "aria-label"?: string;
}

/**
 * Dependency-free autocomplete: a text input plus a results list. Typing calls
 * onQueryChange; the parent supplies filtered options; picking one calls
 * onSelect. Shows a no-results message when the (non-empty) query matches none.
 */
export function Autocomplete({
  query,
  onQueryChange,
  options,
  onSelect,
  placeholder,
  noResultsLabel = "Không có kết quả phù hợp.",
  minQueryLength = 1,
  "aria-label": ariaLabel,
}: AutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);

  const hasQuery = query.trim().length >= minQueryLength;
  const showList = open && hasQuery;

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-background py-1 shadow-md"
        >
          {options.length === 0 ? (
            <li
              role="option"
              aria-selected={false}
              aria-disabled
              className="px-3 py-2 text-sm text-muted-foreground"
            >
              {noResultsLabel}
            </li>
          ) : (
            options.map((option) => (
              <li
                key={option.id}
                role="option"
                aria-selected={false}
                tabIndex={0}
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(option);
                    setOpen(false);
                  }
                }}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none"
                )}
              >
                <span>{option.label}</span>
                {option.detail && (
                  <span className="ml-2 text-muted-foreground">
                    {option.detail}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
