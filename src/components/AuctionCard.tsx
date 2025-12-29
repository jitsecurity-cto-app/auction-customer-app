'use client';

import Link from 'next/link';
import { Auction } from '../types';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const endDate = new Date(auction.end_time);
  const isEnded = auction.status === 'ended' || endDate < new Date();
  const timeRemaining = isEnded 
    ? 'Ended' 
    : `${Math.floor((endDate.getTime() - Date.now()) / (1000 * 60 * 60))}h remaining`;

  return (
    <Link 
      href={`/auctions/${auction.id}`}
      style={{
        display: 'block',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.2s',
        backgroundColor: 'white'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <h3 style={{ 
        margin: '0 0 0.5rem 0', 
        fontSize: '1.25rem',
        color: '#1f2937'
      }}>
        {auction.title}
      </h3>
      <div 
        style={{ 
          marginBottom: '1rem',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}
        // XSS vulnerability: using dangerouslySetInnerHTML without sanitization
        dangerouslySetInnerHTML={{ __html: auction.description }}
      />
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            ${auction.current_bid.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Starting: ${auction.starting_price.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontSize: '0.875rem', 
            color: isEnded ? '#ef4444' : '#10b981',
            fontWeight: 'bold'
          }}>
            {auction.status.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {timeRemaining}
          </div>
        </div>
      </div>
    </Link>
  );
}

