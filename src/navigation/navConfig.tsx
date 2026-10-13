import type { ReactNode } from 'react';
import {
  Bell,
  ChatCircleDots,
  ChatCircleText,
  ChartLineUp,
  Coins,
  FileText,
  GraduationCap,
  Funnel,
  Gear,
  Handshake,
  House,
  ListChecks,
  MapTrifold,
  Path,
  PlusCircle,
  Receipt,
  Package,
  Storefront,
  Truck,
  UsersThree,
  Wrench,
} from '@phosphor-icons/react';
import type { Role } from '@/data/types';

/**
 * The tab bar per role. Bottom bar on mobile, left sidebar on desktop — same
 * items, same order, one definition.
 *
 * Icons are Phosphor at a thin 1.5px stroke, emerald by default and gold when
 * active (handled in AppShell), per the design system.
 */

export interface NavItem {
  /** Matches `tab` on a ScreenRoute so the right item highlights. */
  id: string;
  labelKey: string;
  path: string;
  icon: ReactNode;
}

const ICON_SIZE = 22;

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { id: 'home', labelKey: 'nav.home', path: '/admin', icon: <House size={ICON_SIZE} /> },
    { id: 'map', labelKey: 'nav.map', path: '/admin/map', icon: <MapTrifold size={ICON_SIZE} /> },
    { id: 'leads', labelKey: 'nav.crm', path: '/admin/leads', icon: <Funnel size={ICON_SIZE} /> },
    { id: 'comm', labelKey: 'nav.comm', path: '/admin/comm/templates', icon: <ChatCircleText size={ICON_SIZE} /> },
    { id: 'quotes', labelKey: 'nav.quotes', path: '/admin/quotes', icon: <Receipt size={ICON_SIZE} /> },
    { id: 'deals', labelKey: 'nav.deals', path: '/admin/deals/bot-config', icon: <Handshake size={ICON_SIZE} /> },
    { id: 'suppliers', labelKey: 'nav.suppliers', path: '/admin/suppliers', icon: <Storefront size={ICON_SIZE} /> },
    // Every supplier-payment screen (111–119) lives here for Admin; the directory and its hub stay under Suppliers.
    { id: 'supplierPay', labelKey: 'nav.supplierPay', path: '/supplier-payments', icon: <Coins size={ICON_SIZE} /> },
    // Every delivery screen (101–110) lives here for Admin; suppliers and technicians reach their own from their own tabs.
    { id: 'logistics', labelKey: 'nav.logistics', path: '/shipments', icon: <Truck size={ICON_SIZE} /> },
    { id: 'partners', labelKey: 'nav.partners', path: '/applications', icon: <UsersThree size={ICON_SIZE} /> },
    {
      id: 'analytics',
      labelKey: 'nav.analytics',
      path: '/admin/analytics/funnel',
      icon: <ChartLineUp size={ICON_SIZE} />,
    },
    { id: 'alerts', labelKey: 'nav.alerts', path: '/admin/alerts', icon: <Bell size={ICON_SIZE} /> },
    { id: 'settings', labelKey: 'nav.settings', path: '/settings', icon: <Gear size={ICON_SIZE} /> },
  ],
  surveyor: [
    { id: 'home', labelKey: 'nav.home', path: '/surveyor', icon: <House size={ICON_SIZE} /> },
    {
      id: 'capture',
      labelKey: 'nav.capture',
      path: '/surveyor/capture',
      icon: <PlusCircle size={ICON_SIZE} />,
    },
    {
      id: 'leads',
      labelKey: 'nav.leads',
      path: '/surveyor/leads',
      icon: <ListChecks size={ICON_SIZE} />,
    },
    {
      id: 'earnings',
      labelKey: 'nav.earnings',
      path: '/surveyor/earnings',
      icon: <Coins size={ICON_SIZE} />,
    },
    { id: 'route', labelKey: 'nav.route', path: '/surveyor/route', icon: <Path size={ICON_SIZE} /> },
    { id: 'training', labelKey: 'nav.training', path: '/training', icon: <GraduationCap size={ICON_SIZE} /> },
  ],
  technician: [
    { id: 'home', labelKey: 'nav.home', path: '/technician', icon: <House size={ICON_SIZE} /> },
    { id: 'jobs', labelKey: 'nav.jobs', path: '/technician', icon: <Wrench size={ICON_SIZE} /> },
    { id: 'shipments', labelKey: 'nav.shipments', path: '/shipments', icon: <Truck size={ICON_SIZE} /> },
    { id: 'training', labelKey: 'nav.training', path: '/training', icon: <GraduationCap size={ICON_SIZE} /> },
    { id: 'settings', labelKey: 'nav.settings', path: '/settings', icon: <Gear size={ICON_SIZE} /> },
  ],
  customer: [
    { id: 'home', labelKey: 'nav.home', path: '/customer', icon: <House size={ICON_SIZE} /> },
    { id: 'installation', labelKey: 'nav.installation', path: '/project-status', icon: <Wrench size={ICON_SIZE} /> },
    { id: 'shipments', labelKey: 'nav.shipments', path: '/shipments', icon: <Truck size={ICON_SIZE} /> },
    { id: 'documents', labelKey: 'nav.documents', path: '/documents', icon: <FileText size={ICON_SIZE} /> },
    { id: 'settings', labelKey: 'nav.settings', path: '/settings', icon: <Gear size={ICON_SIZE} /> },
  ],
  supplier: [
    { id: 'orders', labelKey: 'nav.orders', path: '/orders', icon: <Truck size={ICON_SIZE} /> },
    { id: 'messages', labelKey: 'nav.messages', path: '/supplier-messages', icon: <ChatCircleDots size={ICON_SIZE} /> },
    { id: 'catalog', labelKey: 'nav.catalog', path: '/catalog', icon: <Package size={ICON_SIZE} /> },
    { id: 'scorecard', labelKey: 'nav.scorecard', path: '/scorecard', icon: <ChartLineUp size={ICON_SIZE} /> },
    { id: 'agreement', labelKey: 'nav.agreement', path: '/agreement', icon: <FileText size={ICON_SIZE} /> },
    { id: 'invoices', labelKey: 'nav.invoices', path: '/supplier-invoices', icon: <Receipt size={ICON_SIZE} /> },
    { id: 'payments', labelKey: 'nav.payments', path: '/supplier-payment-history', icon: <Coins size={ICON_SIZE} /> },
    { id: 'training', labelKey: 'nav.training', path: '/training', icon: <GraduationCap size={ICON_SIZE} /> },
    { id: 'settings', labelKey: 'nav.settings', path: '/settings', icon: <Gear size={ICON_SIZE} /> },
  ],
};
