import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
  isAnchor?: boolean;
}

interface HeaderDropdownProps {
  label: string;
  items: DropdownItem[];
}

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center gap-1 px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-200 rounded-lg hover:bg-white/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-xl shadow-xl z-[100] overflow-hidden animate-fade-in">
          <div className="py-1">
            {items.map((item, index) => (
              <React.Fragment key={item.label}>
                {item.isAnchor ? (
                  <a
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-sm text-popover-foreground hover:bg-primary/5 hover:text-primary transition-colors font-medium"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-sm text-popover-foreground hover:bg-primary/5 hover:text-primary transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                )}
                {index < items.length - 1 && (
                  <div className="mx-3 border-b border-border/50" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderDropdown;
