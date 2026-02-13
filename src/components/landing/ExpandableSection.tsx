/**
 * Expandable Section - Accordion for landing page details
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './ExpandableSection.css';

interface ExpandableSectionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export function ExpandableSection({ title, children, defaultExpanded = false }: ExpandableSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`expandable-section ${isExpanded ? 'expanded' : ''}`}>
            <button 
                className="expandable-header"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <h3>{title}</h3>
                <ChevronDown size={20} className="expandable-icon" />
            </button>
            <div className="expandable-content">
                <div className="expandable-inner">
                    {children}
                </div>
            </div>
        </div>
    );
}
