"use client";
import { usePathname } from 'next/navigation';
import WhatsAppButton from './WhatsAppButton';

export default function ConditionalWhatsAppButton() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return isHomePage ? <WhatsAppButton /> : null;
} 