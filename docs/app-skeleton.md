# Application layout

`AppSkeleton` lays out a whole application: the header, sidebar, page content,
footer, and a banner area.

```vue
<AppSkeleton>
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
</AppSkeleton>
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

Its height is published as `--picocrank-app-banners-height`, so other sticky
elements can sit below it. `PageToolbar` does this already.

Route: `/page-structure` has a control to show an example banner.
