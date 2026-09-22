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
import { Loading03Icon } from '@hugeicons/core-free-icons';

import {
	hubChildBreadcrumbs,
	hubSectionBreadcrumbs,
	standaloneBreadcrumbs,
	viewItemBreadcrumbs,
} from './vue/data/routeBreadcrumbs.js';

const routes = [
  {
    name: 'Welcome',
    path: '/',
    component: () => import('./vue/examples/Welcome.vue'),
    meta: {
      title: 'Welcome',
      icon: HomeIcon,
    }
  },
  {
    name: 'PageStructure',
    path: '/page-structure',
    component: () => import('./vue/examples/PageStructure.vue'),
    meta: {
      title: 'Page structure',
      icon: LayoutGridIcon,
      breadcrumbs: hubChildBreadcrumbs('NavLayoutsHub', 'PageStructure', 'Page structure'),
    }
  },
  {
    name: 'ThemePreview',
    path: '/theme-preview',
    component: () => import('./vue/examples/ThemePreview.vue'),
    meta: {
      title: 'Theme Switcher',
      icon: PaintBoardIcon,
      breadcrumbs: hubChildBreadcrumbs('NavLayoutsHub', 'ThemePreview', 'Theme Switcher'),
    }
  },
  {
    name: 'UserDetails',
    path: '/user',
    component: () => import('./vue/examples/UserDetails.vue'),
    meta: {
      title: 'User details',
      icon: UserIcon,
      breadcrumbs: standaloneBreadcrumbs('UserDetails', 'User details'),
    }
  },
  {
    name: 'TableExample',
    path: '/table-example',
    title: 'Table Example',
    component: () => import('./vue/examples/TableExample.vue'),
    meta: {
      title: 'Table',
      icon: TableIcon,
      breadcrumbs: hubChildBreadcrumbs('NavDataDisplayHub', 'TableExample', 'Table'),
    }
  },
  {
    name: 'TableRemoteExample',
    path: '/table-remote-example',
    component: () => import('./vue/examples/TableRemoteExample.vue'),
    meta: {
      title: 'Remote table',
      icon: TableIcon,
      breadcrumbs: hubChildBreadcrumbs('NavDataDisplayHub', 'TableRemoteExample', 'Remote table'),
    }
  },
  {
    name: 'ViewItem',
    path: '/view-item/:id',
    component: () => import('./vue/examples/ViewItem.vue'),
    props: true,
    meta: {
      title: 'View item',
      icon: ViewIcon,
      breadcrumbs: viewItemBreadcrumbs,
    }
  },
  {
    name: 'Admin',
    path: '/admin',
    component: () => import('./vue/examples/Admin.vue'),
    meta: {
      title: 'Admin',
      icon: SecurityValidationIcon,
      breadcrumbs: hubChildBreadcrumbs('NavLayoutsHub', 'Admin', 'Admin'),
    }
  },
  {
    name: 'CalendarExample',
    path: '/calendar-example',
    component: () => import('./vue/examples/CalendarExample.vue'),
    props: true,
    meta: {
      title: 'Calendar',
      icon: CalendarIcon,
      breadcrumbs: hubChildBreadcrumbs('NavDataDisplayHub', 'CalendarExample', 'Calendar'),
    }
  },
  {
    name: 'Login',
    path: '/login',
    component: () => import('./vue/examples/Login.vue'),
    meta: {
      title: 'Login',
      icon: SecurityValidationIcon,
      breadcrumbs: standaloneBreadcrumbs('Login', 'Login'),
    }
  },
  {
    name: 'ButtonsExample',
    path: '/buttons-example',
    component: () => import('./vue/examples/ButtonsExample.vue'),
    meta: {
      title: 'Buttons',
      icon: CursorPointer01Icon,
      breadcrumbs: hubChildBreadcrumbs('NavFormsInputHub', 'ButtonsExample', 'Buttons'),
    }
  },
  {
    name: 'FormExample',
    path: '/form-example',
    component: () => import('./vue/examples/FormExample.vue'),
    meta: {
      title: 'Forms',
      icon: EditIcon,
      breadcrumbs: hubChildBreadcrumbs('NavFormsInputHub', 'FormExample', 'Forms'),
    }
  },
  {
    name: 'ReadOnlyTextAreaExample',
    path: '/readonly-textarea-example',
    component: () => import('./vue/examples/ReadOnlyTextAreaExample.vue'),
    meta: {
      title: 'Read-only output',
      icon: ClipboardCopyIcon,
      breadcrumbs: hubChildBreadcrumbs('NavDataDisplayHub', 'ReadOnlyTextAreaExample', 'Read-only output'),
    }
  },
  {
    name: 'StatusExample',
    path: '/status-example',
    component: () => import('./vue/examples/StatusExample.vue'),
    meta: {
      title: 'Status & notifications',
      icon: StatusIcon,
      breadcrumbs: hubChildBreadcrumbs('NavFeedbackStatusHub', 'StatusExample', 'Status & notifications'),
    }
  },
  {
    name: 'DialogExample',
    path: '/dialog-example',
    component: () => import('./vue/examples/DialogExample.vue'),
    meta: {
      title: 'Dialog',
      icon: InformationCircleIcon,
      breadcrumbs: hubChildBreadcrumbs('NavFeedbackStatusHub', 'DialogExample', 'Dialog'),
    }
  },
  {
    name: 'LoadingAreaExample',
    path: '/loading-area-example',
    component: () => import('./vue/examples/LoadingAreaExample.vue'),
    meta: {
      title: 'Loading area',
      icon: Loading03Icon,
      breadcrumbs: hubChildBreadcrumbs('NavFeedbackStatusHub', 'LoadingAreaExample', 'Loading area'),
    }
  },
  {
    name: 'TabsExample',
    path: '/tabs-example',
    component: () => import('./vue/examples/TabsExample.vue'),
    meta: {
      title: 'Tabs',
      icon: Menu01Icon,
      breadcrumbs: hubChildBreadcrumbs('NavLayoutsHub', 'TabsExample', 'Tabs'),
    }
  },
  {
    name: 'NavigationGridExample',
    path: '/navigation-grid',
    component: () => import('./vue/examples/NavigationGridExample.vue'),
    meta: {
      title: 'Navigation Grid',
      icon: Navigation01Icon,
      breadcrumbs: hubChildBreadcrumbs('NavLayoutsHub', 'NavigationGridExample', 'Navigation Grid'),
    }
  },
  {
    name: 'NavLayoutsHub',
    path: '/nav/layouts',
    component: () => import('./vue/examples/NavSectionHub.vue'),
    meta: {
      title: 'Layouts',
      icon: LayoutGridIcon,
      breadcrumbs: hubSectionBreadcrumbs('NavLayoutsHub'),
    }
  },
  {
    name: 'NavDataDisplayHub',
    path: '/nav/data-display',
    component: () => import('./vue/examples/NavSectionHub.vue'),
    meta: {
      title: 'Data display',
      icon: TableIcon,
      breadcrumbs: hubSectionBreadcrumbs('NavDataDisplayHub'),
    }
  },
  {
    name: 'NavFormsInputHub',
    path: '/nav/forms-input',
    component: () => import('./vue/examples/NavSectionHub.vue'),
    meta: {
      title: 'Forms & input',
      icon: EditIcon,
      breadcrumbs: hubSectionBreadcrumbs('NavFormsInputHub'),
    }
  },
  {
    name: 'NavFeedbackStatusHub',
    path: '/nav/feedback-status',
    component: () => import('./vue/examples/NavSectionHub.vue'),
    meta: {
      title: 'Feedback & status',
      icon: StatusIcon,
      breadcrumbs: hubSectionBreadcrumbs('NavFeedbackStatusHub'),
    }
  },
  {
    name: 'NavPatternsHub',
    path: '/nav/patterns',
    component: () => import('./vue/examples/NavSectionHub.vue'),
    meta: {
      title: 'Patterns',
      icon: CursorPointer01Icon,
      breadcrumbs: hubSectionBreadcrumbs('NavPatternsHub'),
    }
  },
  {
    name: 'LoginExample',
    path: '/login-example',
    component: () => import('./vue/examples/LoginExample.vue'),
    meta: {
      title: 'Login',
      icon: SecurityValidationIcon,
      breadcrumbs: hubChildBreadcrumbs('NavFormsInputHub', 'LoginExample', 'Login'),
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router
