import React, { useState, useEffect, useRef } from "react";
import "../css/autocomplete.css";

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

interface Suggestion {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search address...",
  required = false,
  onKeyDown,
  className = "",
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions from Nominatim API
  const fetchSuggestions = async (searchText: string) => {
    if (!searchText.trim() || searchText.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch matching locations in Kathmandu/Nepal
      const query = encodeURIComponent(`${searchText}, Kathmandu, Nepal`);
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=5&countrycodes=np`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "KTM-Bites-Delivery-App/1.0",
        },
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const data: Suggestion[] = await response.json();

      // Format and filter suggestions nicely
      const formatted = data.map((item) => {
        // Construct a clean, shorter display name
        const addr = item.address;
        const parts: string[] = [];

        if (addr.road) parts.push(addr.road);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.town) parts.push(addr.town);
        if (addr.village) parts.push(addr.village);
        if (addr.city) parts.push(addr.city);

        // Fallback to display_name if no parts are found
        if (parts.length === 0) {
          return item.display_name;
        }

        // Add Kathmandu, Nepal if not already present
        const fullString = parts.join(", ");
        if (!fullString.toLowerCase().includes("nepal")) {
          return `${fullString}, Kathmandu`;
        }
        return fullString;
      });

      // Deduplicate suggestions
      const unique = Array.from(new Set(formatted));
      setSuggestions(unique);
      setIsOpen(unique.length > 0);
    } catch (error) {
      console.error("Failed to fetch address suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 3) {
      setLoading(true);
      setIsOpen(true);
      // Debounce Nominatim API requests by 500ms
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 500);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className={`autocomplete-wrapper ${className}`} ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        onKeyDown={onKeyDown}
        className="autocomplete-input"
        autoComplete="off"
      />
      {loading && (
        <div className="autocomplete-spinner">
          <span className="material-symbols-rounded spinner-rotate">autorenew</span>
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="autocomplete-dropdown">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="autocomplete-item"
            >
              <span className="material-symbols-rounded autocomplete-item-icon">location_on</span>
              <span className="autocomplete-item-text">{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
