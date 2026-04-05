import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Grouped nav block with optional section title (hidden on icon-only sidebar width).
 */
const SidebarNavSection = ({ title, children, className, isFirst }) => (
  <div className={cn('space-y-1', className)}>
    {title ? (
      <p
        className={cn(
          'px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block',
          isFirst ? 'pt-1' : 'pt-4'
        )}
      >
        {title}
      </p>
    ) : null}
    {children}
  </div>
);

export default SidebarNavSection;
