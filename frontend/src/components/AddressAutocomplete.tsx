import React, { useState, useEffect, useRef } from "react";
import { searchKathmanduLocations, type GeocodeSuggestion } from "../api/geocode";

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter street address...",
  className = "",
  onKeyDown
}) => {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<any>(null);


  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchKathmanduLocations(query);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setLoading(false);
    }, 450); // Debounce queries to Nominatim to adhere to their usage policies
  };

  const handleSelect = (suggestion: GeocodeSuggestion) => {
    onChange(suggestion.name);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className={`address-autocomplete-container ${className}`} ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        autoComplete="off"
        style={{ width: "100%", border: "none", outline: "none", background: "transparent", font: "inherit", color: "inherit" }}
      />
      {loading && (
        <span 
          className="material-symbols-rounded" 
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "16px",
            color: "#f28b46",
            animation: "cd-spin 0.8s linear infinite"
          }}
        >
          autorenew
        </span>
      )}
      
      {isOpen && suggestions.length > 0 && (
        <ul 
          className="address-autocomplete-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid rgba(212, 196, 168, 0.35)",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(42, 36, 32, 0.12)",
            zIndex: 999,
            listStyle: "none",
            margin: 0,
            padding: "6px 0",
            maxHeight: "220px",
            overflowY: "auto"
          }}
        >
          {suggestions.map((item, idx) => (
            <li 
              key={idx}
              onClick={() => handleSelect(item)}
              className="address-autocomplete-item"
              style={{
                padding: "10px 14px",
                fontSize: "12.5px",
                color: "#4a3f38",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background 0.15s ease",
                borderBottom: idx < suggestions.length - 1 ? "1px solid rgba(212, 196, 168, 0.15)" : "none"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(242, 139, 70, 0.08)";
                e.currentTarget.style.color = "#f28b46";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#4a3f38";
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: "16px", opacity: 0.7 }}>location_on</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.display_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
