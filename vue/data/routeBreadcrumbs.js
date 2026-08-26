import { navSectionHubs, topBarHubRoutes } from './navSectionHubs.js'

/** Example route name → hub route name (from navSectionHubs). */
const routeToHub = Object.fromEntries(
	topBarHubRoutes.flatMap((hubRouteName) =>
		navSectionHubs[hubRouteName].links
			.filter((link) => link.name)
			.map((link) => [link.name, hubRouteName]),
	),
)

export function welcomeCrumb() {
	return { name: 'Welcome', to: { name: 'Welcome' } }
}

export function hubMenuItems() {
	return topBarHubRoutes.map((hubRouteName) => {
		const hub = navSectionHubs[hubRouteName]
		return {
			name: hub.title,
			to: { name: hubRouteName },
		}
	})
}

/** Hub section picker — all example categories in one dropdown. */
export function hubMenuCrumb(activeHubRouteName) {
	const hub = navSectionHubs[activeHubRouteName]
	return {
		name: hub.title,
		to: { name: activeHubRouteName },
		menu: hubMenuItems(),
	}
}

export function routeCrumb(routeName, title, params = undefined) {
	return {
		name: title,
		to: params ? { name: routeName, params } : { name: routeName },
	}
}

/** Welcome → hub section (hub landing pages). */
export function hubSectionBreadcrumbs(hubRouteName) {
	return () => [welcomeCrumb(), hubMenuCrumb(hubRouteName)]
}

/** Welcome → hub menu → example page (most grid-linked examples). */
export function hubChildBreadcrumbs(hubRouteName, routeName, title) {
	return () => [
		welcomeCrumb(),
		hubMenuCrumb(hubRouteName),
		routeCrumb(routeName, title),
	]
}

/** Resolve hub for a route name when only the child is known. */
export function hubForRoute(routeName) {
	return routeToHub[routeName] ?? null
}

const viewItemLabels = {
	1: 'Acme deployment',
	Alice: 'Alice',
	Bob: 'Bob',
}

export function viewItemLabel(id) {
	const key = String(id)
	if (viewItemLabels[key]) {
		return viewItemLabels[key]
	}
	return key.charAt(0).toUpperCase() + key.slice(1)
}

/** Table row detail: Welcome → hub menu → Table → record. */
export function viewItemBreadcrumbs(route) {
	const id = route.params.id
	return [
		welcomeCrumb(),
		hubMenuCrumb('NavDataDisplayHub'),
		routeCrumb('TableExample', 'Table'),
		routeCrumb('ViewItem', viewItemLabel(id), { id }),
	]
}

/** Standalone pages with no hub parent. */
export function standaloneBreadcrumbs(routeName, title) {
	return () => [welcomeCrumb(), routeCrumb(routeName, title)]
}
