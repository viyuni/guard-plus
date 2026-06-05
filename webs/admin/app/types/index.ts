import type { LucideIcon } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';

export interface MenuItem {
  title: string;
  to?: RouteLocationRaw;
  icon?: LucideIcon;
  superAdminOnly?: boolean;
  items?: {
    title: string;
    to: RouteLocationRaw;
    superAdminOnly?: boolean;
  }[];
}
