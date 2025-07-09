import React, { useState, useRef } from 'react';

interface TagSelectProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    options: { id: number; name: string }[];
    placeholder?: string;
    className?: string;
}

const TagSelect: React.FC<TagSelectProps> = ({ name, value, onChange, options, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Parsear el valor como array de strings
    const selectedTags = value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    const handleTagToggle = (tagName: string) => {
        let newTags;
        if (selectedTags.includes(tagName)) {
            newTags = selectedTags.filter(tag => tag !== tagName);
        } else {
            newTags = [...selectedTags, tagName];
        }
        
        // Simular evento de cambio
        const syntheticEvent = {
            target: { name, value: newTags.join(', ') }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(syntheticEvent);
    };

    const handleRemoveTag = (tagName: string) => {
        const newTags = selectedTags.filter(tag => tag !== tagName);
        const syntheticEvent = {
            target: { name, value: newTags.join(', ') }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(syntheticEvent);
    };

    const filteredOptions = options.filter(option => 
        option.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(option.name)
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="min-h-[38px] flex flex-wrap gap-1 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus-within:ring-blue-500 focus-within:border-blue-500">
                {selectedTags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(tag);
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    placeholder={selectedTags.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] outline-none text-sm border-none shadow-none focus:ring-0 p-0"
                />
            </div>
            
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">No hay opciones disponibles</div>
                    ) : (
                        filteredOptions.map(option => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleTagToggle(option.name)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 focus:outline-none focus:bg-slate-100"
                            >
                                {option.name}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default TagSelect;
