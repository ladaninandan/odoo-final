import React from 'react';
import { cn } from '../../lib/utils';

const baseClass =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 justify-center sm:justify-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card text-muted-foreground hover:bg-accent hover:text-accent-foreground';

/**
 * Same footprint as sidebar NavLinks, for opening routes in a new tab (e.g. customer display).
 */
const SidebarExternalLink = ({ href, icon: Icon, label, title: titleAttr }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={titleAttr || label}
    className={cn(baseClass)}
  >
    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
    <span className="truncate hidden sm:inline">{label}</span>
  </a>
);

export default SidebarExternalLink;
