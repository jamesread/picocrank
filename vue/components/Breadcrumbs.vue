<template>
	<nav id="breadcrumbs" class="breadcrumbs" aria-label="Breadcrumb">
		<div class="breadcrumbs-links flex-row">
			<template v-for="(link, index) in links" :key="`${link.name}-${index}`">
				<HugeiconsIcon
					v-if="index > 0"
					:icon="ArrowRight01Icon"
					class="separator"
					width="0.85em"
					height="0.85em"
					aria-hidden="true"
				/>

				<nav
					v-if="hasMenu(link)"
					class="menu breadcrumb-menu"
					:aria-label="`${link.name} sections`"
				>
					<ul>
						<li>
							<span class="submenu">
								<router-link
									v-if="link.to"
									:to="link.to"
									class="button breadcrumb-link"
									:aria-current="isLast(index) ? 'page' : undefined"
								>
									<span>{{ link.name }}</span>
								</router-link>
								<span
									v-else
									class="button breadcrumb-link"
									:aria-current="isLast(index) ? 'page' : undefined"
								>
									{{ link.name }}
								</span>
							</span>
							<div>
								<ul>
									<li v-for="menuItem in link.menu" :key="menuItem.name">
										<router-link
											:to="menuItem.to"
											:class="{ active: isMenuItemActive(link, menuItem) }"
										>
											{{ menuItem.name }}
										</router-link>
									</li>
								</ul>
							</div>
						</li>
					</ul>
				</nav>

				<router-link
					v-else-if="!isLast(index)"
					:to="link.to ?? link.href"
					class="button breadcrumb-link"
				>
					<span>{{ link.name }}</span>
				</router-link>

				<span
					v-else
					class="button breadcrumb-link active"
					aria-current="page"
				>
					<span>{{ link.name }}</span>
				</span>
			</template>
		</div>
	</nav>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'

const route = useRoute()
const links = ref([])

function hasMenu(link) {
	return Array.isArray(link.menu) && link.menu.length > 0
}

function isLast(index) {
	return index === links.value.length - 1
}

function isMenuItemActive(link, menuItem) {
	const activeRoute = link.to?.name
	const itemRoute = menuItem.to?.name
	return activeRoute != null && activeRoute === itemRoute
}

watch(() => route.matched, (matched) => {
	links.value = []
	matched.forEach((record) => {
		if (record.meta && record.meta.breadcrumbs) {
			record.meta.breadcrumbs(route).forEach((item) => {
				links.value.push({
					name: item.name,
					to: item.to,
					href: item.href || record.path || '/',
					menu: item.menu,
				})
			})
		} else if (record.name) {
			links.value.push({
				name: record.meta?.title || record.name,
				to: { name: record.name, params: route.params, query: route.query },
				href: route.fullPath || record.path || '/',
			})
		}
	})
}, { immediate: true })
</script>

<style scoped>
.breadcrumbs {
	flex: 1 1 auto;
	min-width: 0;
}

.breadcrumbs-links {
	display: flex;
	align-items: center;
	gap: 0.0625rem;
	flex-wrap: wrap;
}

.breadcrumb-menu {
	display: inline-flex;
	flex-shrink: 0;
}

.breadcrumb-menu > ul {
	list-style: none;
	padding: 0;
	margin: 0;
}

.breadcrumb-link {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.5em 0.375em;
	border-radius: 0.25em;
	text-decoration: none;
	color: var(--header-fg-color);
	transition: background-color 0.15s ease, color 0.15s ease;
	white-space: nowrap;
	border: 0;
	font-weight: normal;
	background-color: transparent;
	cursor: default;
}

a.breadcrumb-link {
	cursor: pointer;
}

.breadcrumb-link.active {
	text-decoration: underline;
	font-weight: 500;
}

.separator {
	flex-shrink: 0;
	color: var(--header-fg-color);
	opacity: 0.4;
}
</style>

<style>
header .breadcrumbs a.breadcrumb-link:hover,
header .breadcrumbs a.breadcrumb-link:focus-visible,
header .breadcrumbs .breadcrumb-menu.menu > ul > li:hover,
header .breadcrumbs .breadcrumb-menu.menu > ul > li:focus-within,
header .breadcrumbs .breadcrumb-menu.menu > ul > li:hover > span > a,
header .breadcrumbs .breadcrumb-menu.menu > ul > li:focus-within > span > a,
header .breadcrumbs .breadcrumb-menu.menu > ul div ul a:hover,
header .breadcrumbs .breadcrumb-menu.menu > ul div ul a:focus-visible {
	background-color: var(--header-hover-background-color);
	color: var(--header-hover-text-color);
}

header .breadcrumbs a.breadcrumb-link:focus-visible {
	outline-color: var(--header-focus-outline-color);
}

header .breadcrumb-menu.menu > ul > li {
	border-radius: 0.25em;
}

header .breadcrumb-menu.menu > ul li span.submenu .breadcrumb-link {
	text-decoration: inherit;
}

header .breadcrumb-menu.menu > ul li span.submenu .breadcrumb-link[aria-current="page"] {
	text-decoration: underline;
	font-weight: 500;
}
</style>
