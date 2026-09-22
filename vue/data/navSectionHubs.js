import { Pin02Icon } from '@hugeicons/core-free-icons'

export const topBarHubRoutes = [
	'NavLayoutsHub',
	'NavDataDisplayHub',
	'NavFormsInputHub',
	'NavFeedbackStatusHub',
	'NavPatternsHub',
]

export function helloWorld() {
	alert('Hello World')
}

export const navSectionHubs = {
	NavLayoutsHub: {
		title: 'Layouts',
		subtitle: 'Page structure, navigation, and application shell',
		sectionId: 'nav-layouts',
		links: [
			{
				name: 'PageStructure',
				options: { description: 'Configure the example app shell' },
			},
			{
				name: 'ThemePreview',
				title: 'Theme Switcher',
				options: { description: 'Drop-in themes on Femtocrank' },
			},
			{
				name: 'ViewItem',
				title: 'View item',
				options: { params: { id: 1 }, description: 'Detail view with breadcrumbs' },
			},
			{
				name: 'NavigationGridExample',
				title: 'Navigation Grid',
				options: { description: 'Icon grid for settings hubs' },
			},
			{
				name: 'Admin',
				options: { description: 'Admin-style section layout' },
			},
			{
				name: 'TabsExample',
				title: 'Tabs',
				options: { description: 'Tabbed content regions' },
			},
		],
	},
	NavDataDisplayHub: {
		title: 'Data display',
		subtitle: 'Tables, calendars, and read-only output',
		sectionId: 'nav-data',
		links: [
			{
				name: 'TableExample',
				title: 'Table',
				options: { description: 'Sorting, pagination, and filters' },
			},
			{
				name: 'TableRemoteExample',
				title: 'Remote table',
				options: { description: 'Server-style fetchRows pagination and filters' },
			},
			{
				name: 'CalendarExample',
				title: 'Calendar',
				options: { description: 'Month view with events' },
			},
			{
				name: 'ReadOnlyTextAreaExample',
				title: 'Read-only output',
				options: { description: 'Copyable read-only text areas' },
			},
		],
	},
	NavFormsInputHub: {
		title: 'Forms & input',
		subtitle: 'Buttons, forms, and authentication',
		sectionId: 'nav-forms',
		links: [
			{
				name: 'ButtonsExample',
				title: 'Buttons',
				options: { description: 'Button variants and toolbars' },
			},
			{
				name: 'FormExample',
				title: 'Forms',
				options: { description: 'Labels, inputs, and fieldsets' },
			},
			{
				name: 'LoginExample',
				title: 'Login',
				options: { description: 'Auth form with OAuth tabs' },
			},
		],
	},
	NavFeedbackStatusHub: {
		title: 'Feedback & status',
		subtitle: 'Notifications, dialogs, and inline status',
		sectionId: 'nav-feedback',
		links: [
			{
				name: 'StatusExample',
				title: 'Status & notifications',
				options: { description: 'Block, inline, and popup notifications' },
			},
			{
				name: 'DialogExample',
				title: 'Dialog',
				options: { description: 'Modal dialogs and confirmations' },
			},
			{
				name: 'LoadingAreaExample',
				title: 'Loading area',
				options: { description: 'Async placeholder with spinner' },
			},
		],
	},
	NavPatternsHub: {
		title: 'Patterns',
		subtitle: 'Reusable UI patterns and interactions',
		sectionId: 'nav-patterns',
		links: [
			{
				type: 'callback',
				title: 'Callback example',
				callback: helloWorld,
				options: {
					icon: Pin02Icon,
					description: 'Navigation item that runs a function instead of routing',
				},
			},
		],
	},
}

function registerNavLink(nav, link, { onHelloWorld = helloWorld } = {}) {
	if (link.type === 'callback') {
		const callback = link.callback ?? onHelloWorld
		nav.addCallback(link.title, callback, link.options ?? {})
		return
	}

	nav.addRouterLink(link.name, link.title ?? null, link.options ?? {})
}

/** Flat example list for the sidebar — hub routes are not registered here. */
export function registerSidebarNavigation(nav, { onHelloWorld = helloWorld } = {}) {
	if (!nav) {
		return
	}

	nav.addRouterLink('Welcome')

	for (const routeName of topBarHubRoutes) {
		const hub = navSectionHubs[routeName]
		nav.addSection(hub.title, { name: hub.sectionId })

		for (const link of hub.links) {
			registerNavLink(nav, link, { onHelloWorld })
		}
	}
}

/** Hub category links for the header top bar. */
export function registerTopBarNavigation(nav) {
	if (!nav) {
		return
	}

	for (const routeName of topBarHubRoutes) {
		nav.addRouterLink(routeName)
	}
}

/** Example links for a single hub page (NavigationGrid). */
export function registerHubNavigation(nav, hubRouteName, { onHelloWorld = helloWorld } = {}) {
	const hub = navSectionHubs[hubRouteName]
	if (!nav || !hub) {
		return
	}

	for (const link of hub.links) {
		registerNavLink(nav, link, { onHelloWorld })
	}
}

/** Hub overview grid for the welcome page. */
export function registerWelcomeHubGrid(nav) {
	if (!nav) {
		return
	}

	for (const routeName of topBarHubRoutes) {
		const hub = navSectionHubs[routeName]
		nav.addRouterLink(routeName, hub.title, { description: hub.subtitle })
	}
}
