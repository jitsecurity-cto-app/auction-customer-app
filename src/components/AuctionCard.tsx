'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Auction } from '../types';
import { formatCurrency, formatTimeRemaining } from '@design-system/utils';

interface AuctionCardProps {
  auction: Auction & { workflow_state?: 'active' | 'pending_sale' | 'shipping' | 'complete' };
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Calculate time-based values only on client to avoid hydration mismatch
    const endDate = new Date(auction.end_time);
    const ended = auction.status === 'ended' || endDate < new Date();
    setIsEnded(ended);

    if (ended) {
      setTimeRemaining('Ended');
    } else {
      const updateTimeRemaining = () => {
        setTimeRemaining(formatTimeRemaining(endDate));
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [auction.end_time, auction.status, mounted]);

  const workflowState = auction.workflow_state || (auction.status === 'active' ? 'active' : 'pending_sale');

  const getStatusClasses = () => {
    if (isEnded) return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  };

  const getWorkflowBadgeClasses = (state?: string) => {
    switch (state) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending_sale':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'shipping':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'complete':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getAccentBarClasses = () => {
    if (isEnded) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-primary-500 to-primary-600';
  };

  // Truncate description for card view
  const truncateDescription = (html: string, maxLength: number = 100) => {
    const text = html.replace(/<[^>]*>/g, '');
    if (text.length <= maxLength) return html;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link href={`/auctions/${auction.id}`} className="group block">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        {/* Top accent bar */}
        <div className={`h-1 ${getAccentBarClasses()}`} />
        <div className="p-5">
          {/* Title + badge row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {auction.title}
            </h3>
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses()}`}>
                {auction.status}
              </span>
              {workflowState && workflowState !== 'active' && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getWorkflowBadgeClasses(workflowState)}`}>
                  {workflowState.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Description - intentionally uses dangerouslySetInnerHTML (XSS vulnerability) */}
          <div
            className="text-sm text-slate-500 line-clamp-2 mb-4"
            dangerouslySetInnerHTML={{ __html: truncateDescription(auction.description) }}
          />

          {/* Footer: Price + Time */}
          <div className="flex items-end justify-between pt-3 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Current Bid</div>
              <div className="text-lg font-bold text-primary-600">
                {formatCurrency(auction.current_bid || auction.starting_price)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-0.5">{isEnded ? 'Ended' : 'Ends in'}</div>
              <div className="text-sm font-medium text-slate-700">
                {isEnded ? (
                  <span className="text-red-600">Ended</span>
                ) : (
                  timeRemaining
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
