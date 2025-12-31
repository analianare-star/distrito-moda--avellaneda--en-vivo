import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';

interface AddressDetails {
    street: string;
    number: string;
    city: string;
    province: string;
    zip: string;
}

interface AddressAutocompleteProps {
    onSelect: (details: AddressDetails) => void;
}

// Mock Database of Addresses in "Distrito Moda" (Avellaneda/Flores area)
const MOCK_PLACES = [
    { label: "Av. Avellaneda 2890, Flores, CABA", details: { street: "Av. Avellaneda", number: "2890", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Av. Avellaneda 3050, Flores, CABA", details: { street: "Av. Avellaneda", number: "3050", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Argerich 450, Flores, CABA", details: { street: "Argerich", number: "450", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Argerich 555, Flores, CABA", details: { street: "Argerich", number: "555", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Helguera 300, Flores, CABA", details: { street: "Helguera", number: "300", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Helguera 420, Flores, CABA", details: { street: "Helguera", number: "420", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Cuenca 600, Flores, CABA", details: { street: "Cuenca", number: "600", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Bogotá 2900, Flores, CABA", details: { street: "Bogotá", number: "2900", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Av. Nazca 400, Flores, CABA", details: { street: "Av. Nazca", number: "400", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Campana 500, Flores, CABA", details: { street: "Campana", number: "500", city: "Flores", province: "CABA", zip: "1406" } },
    { label: "Morón 3100, Flores, CABA", details: { street: "Morón", number: "3100", city: "Flores", province: "CABA", zip: "1406" } },
];

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<typeof MOCK_PLACES>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        
        if (val.length > 1) {
            const filtered = MOCK_PLACES.filter(p => 
                p.label.toLowerCase().includes(val.toLowerCase())
            );
            setSuggestions(filtered);
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (place: typeof MOCK_PLACES[0]) => {
        setQuery(place.label);
        setIsOpen(false);
        onSelect(place.details);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-sm bg-white focus:ring-2 focus:ring-dm-crimson/20 focus:border-dm-crimson transition-all"
                    placeholder="Buscá tu dirección (ej: Avellaneda, Argerich...)"
                    value={query}
                    onChange={handleInputChange}
                    autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/1200px-Google_Maps_icon_%282020%29.svg.png" 
                        alt="Google Maps" 
                        className="w-4 h-4 opacity-50" 
                    />
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {suggestions.map((place, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(place)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="block font-medium text-dm-dark">{place.label.split(',')[0]}</span>
                                <span className="block text-xs text-gray-500">{place.label.split(',').slice(1).join(',')}</span>
                            </div>
                        </button>
                    ))}
                    <div className="px-2 py-1 bg-gray-50 flex justify-end">
                         <span className="text-[10px] text-gray-400">powered by Google (Simulated)</span>
                    </div>
                </div>
            )}
            
            {isOpen && query.length > 1 && suggestions.length === 0 && (
                 <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl p-4 text-center">
                    <p className="text-sm text-gray-500">No se encontraron direcciones.</p>
                 </div>
            )}
        </div>
    );
};