import { createRouter, createWebHistory } from 'vue-router';

import { HomeIcon } from '@hugeicons/core-free-icons';
import { TableIcon } from '@hugeicons/core-free-icons';
import { ViewIcon } from '@hugeicons/core-free-icons';
import { SecurityValidationIcon } from '@hugeicons/core-free-icons';
import { CalendarIcon } from '@hugeicons/core-free-icons';
import { EditIcon } from '@hugeicons/core-free-icons';
import { Menu01Icon } from '@hugeicons/core-free-icons';
import { Navigation01Icon } from '@hugeicons/core-free-icons';
import { ClipboardCopyIcon } from '@hugeicons/core-free-icons';
import { CursorPointer01Icon } from '@hugeicons/core-free-icons';
import { LayoutGridIcon } from '@hugeicons/core-free-icons';
import { StatusIcon } from '@hugeicons/core-free-icons';
import { PaintBoardIcon } from '@hugeicons/core-free-icons';
import { UserIcon } from '@hugeicons/core-free-icons';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';

const routes = [
  {
    name: 'Welcome',
    path: '/',
    component: () => import('./vue/views/Welcome.vue'),
    meta: {
      title: 'Welcome',
      icon: HomeIcon,
    }
  },
  {
    name: 'PageStructure',
    path: '/page-structure',
    component: () => import('./vue/views/PageStructure.vue'),
    meta: {
      title: 'Page structure',
      icon: LayoutGridIcon,
    }
  },
  {
    name: 'ThemePreview',
    path: '/theme-preview',
    component: () => import('./vue/views/ThemePreview.vue'),
    meta: {
      title: 'Theme Switcher',
      icon: PaintBoardIcon,
    }
  },
  {
    name: 'UserDetails',
    path: '/user',
    component: () => import('./vue/views/UserDetails.vue'),
    meta: {
      title: 'User details',
      icon: UserIcon,
    }
  },
  {
    name: 'TableExample',
    path: '/table-example',
    title: 'Table Example',
    component: () => import('./vue/views/TableExample.vue'),
    meta: {
      title: 'Table',
      icon: TableIcon,
    }
  },
  {
    name: 'ViewItem',
    path: '/view-item/:id',
    component: () => import('./vue/views/ViewItem.vue'),
    props: true,
    meta: {
      title: 'View item',
      icon: ViewIcon,
    }
  },
  {
    name: 'Admin',
    path: '/admin',
    component: () => import('./vue/views/Admin.vue'),
    meta: {
      title: 'Admin',
      icon: SecurityValidationIcon,
    }
  },
  {
    name: 'CalendarExample',
    path: '/calendar-example',
    component: () => import('./vue/views/CalendarExample.vue'),
    props: true,
    meta: {
      title: 'Calendar',
      icon: CalendarIcon,
    }
  },
  {
    name: 'Login',
    path: '/login',
    component: () => import('./vue/views/Login.vue'),
    meta: {
      title: 'Login',
      icon: SecurityValidationIcon,
    }
  },
  {
    name: 'ButtonsExample',
    path: '/buttons-example',
    component: () => import('./vue/views/ButtonsExample.vue'),
    meta: {
      title: 'Buttons',
      icon: CursorPointer01Icon,
    }
  },
  {
    name: 'FormExample',
    path: '/form-example',
    component: () => import('./vue/views/FormExample.vue'),
    meta: {
      title: 'Forms',
      icon: EditIcon,
    }
  },
  {
    name: 'ReadOnlyTextAreaExample',
    path: '/readonly-textarea-example',
    component: () => import('./vue/views/ReadOnlyTextAreaExample.vue'),
    meta: {
      title: 'Read-only output',
      icon: ClipboardCopyIcon,
    }
  },
  {
    name: 'StatusExample',
    path: '/status-example',
    component: () => import('./vue/views/StatusExample.vue'),
    meta: {
      title: 'Status & notifications',
      icon: StatusIcon,
    }
  },
  {
    name: 'DialogExample',
    path: '/dialog-example',
    component: () => import('./vue/views/DialogExample.vue'),
    meta: {
      title: 'Dialog',
      icon: InformationCircleIcon,
    }
  },
  {
    name: 'TabsExample',
    path: '/tabs-example',
    component: () => import('./vue/views/TabsExample.vue'),
    meta: {
      title: 'Tabs',
      icon: Menu01Icon,
    }
  },
  {
    name: 'NavigationGridExample',
    path: '/navigation-grid',
    component: () => import('./vue/views/NavigationGridExample.vue'),
    meta: {
      title: 'Navigation Grid',
      icon: Navigation01Icon,
    }
  },
  {
    name: 'LoginExample',
    path: '/login-example',
    component: () => import('./vue/views/LoginExample.vue'),
    meta: {
      title: 'Login',
      icon: SecurityValidationIcon,
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router
