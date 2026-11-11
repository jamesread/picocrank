# Application layout

`AppShell` lays out a whole application: the header, sidebar, page content,
footer, and a banner area.

```vue
<AppShell>
	<template #header>
		<Header title="My app" />
	</template>

	<template #sidebar>
		<Sidebar />
	</template>

	<template #banners>
		<NotificationBlock type="warning" role="status" message="Connection lost." />
	</template>

	<router-view />

	<template #footer>My app</template>
</AppShell>
```

| Slot | Content |
|------|---------|
| `header` | The `Header` |
| `sidebar` | The `Sidebar`, if the application has one |
| `banners` | Application-wide notices |
| default | The page, inside `<main>` |
| `footer` | The page footer; omitted when the slot is not used |

## Banners

Put notices users must not miss, such as a lost connection, in the `banners`
slot rather than in `Header`'s `toolbar` slot. A toolbar that does not fit moves
into a closed menu, which hides anything inside it.

The banner area stays visible below the header while the page scrolls, and takes
no space when it is empty. Give each banner the `role` that suits its urgency:
`status` for most notices, or `alert` for ones that should interrupt a screen
reader.

Banners in the slot are styled as one strip attached to the header: square
corners, no space between them, a single divider line between neighbours, and
the header's shadow below the last one. While banners are shown the header drops
its own shadow, so it does not fall across them. The banner area deliberately
stays below the header in stacking order, so header menus and the sidebar drawer
still open over it.

Its height is published as `--picocrank-app-banners-height`, so other sticky
elements can sit below it. `PageToolbar` does this already.

### Creating banners at runtime

`AppShell` does not keep a list of banners itself. To let pages add and remove
them, keep the list in `App.vue` and share it with `provide`:

```vue
<template #banners>
	<NotificationBlock
		v-for="banner in banners"
		:key="banner.id"
		v-bind="banner.props"
		:dismissible="banner.dismissible"
		@dismiss="dismissBanner(banner.id)"
	/>
</template>
```

```js
const banners = ref([])
let nextId = 1

// Skip ids already in use, so a generated id never replaces a banner that was
// given that id explicitly.
function generateBannerId() {
	let candidate
	do {
		candidate = `banner-${nextId++}`
	} while (banners.value.some((b) => b.id === candidate))
	return candidate
}

function showBanner({ id, dismissible = false, ...props }) {
	const bannerId = id ?? generateBannerId()
	const banner = { id: bannerId, dismissible, props }
	const existing = banners.value.findIndex((b) => b.id === bannerId)

	if (existing === -1) {
		banners.value = [...banners.value, banner]
	} else {
		banners.value = banners.value.map((b, i) => (i === existing ? banner : b))
	}

	return bannerId
}

function dismissBanner(id) {
	banners.value = banners.value.filter((banner) => banner.id !== id)
}

provide('appBanners', {
	banners,
	show: showBanner,
	dismiss: dismissBanner,
	clear: () => { banners.value = [] },
})
```

Any page can then show or remove a banner. The remaining options are passed to
`NotificationBlock` as props. Give a banner a fixed `id` when it should replace
itself rather than stack, such as a connection status:

```js
const appBanners = inject('appBanners')

appBanners.show({
	id: 'connection-lost',
	type: 'severe',
	role: 'alert',
	message: 'Connection to the server was lost. Retrying…',
})

appBanners.dismiss('connection-lost')
```

Leave a banner non-dismissible when the application should decide when it goes,
such as a lost connection. Set `dismissible: true` when the user may close it:
clicking the banner, or the × button at its end, removes it. Links inside it
still work without dismissing it:

```js
appBanners.show({
	id: 'new-version',
	type: 'note',
	dismissible: true,
	message: 'A new version is available.',
})
```

Routes:

- `/app-shell-example` creates banners at runtime and shows the code above.
- `/page-structure` has a control to show a fixed example banner.
