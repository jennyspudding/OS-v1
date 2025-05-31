"use client";
import { usePathname } from 'next/navigation';
import WhatsAppButton from './WhatsAppButton';

export default function ConditionalWhatsAppButton() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isExpressStorePage = pathname === '/express-store';
  
  return (isHomePage || isExpressStorePage) ? <WhatsAppButton /> : null;
} 