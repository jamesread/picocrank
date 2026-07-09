<template>
	<div
		class="notification-popup notification show"
		:class="popup.class"
		role="status"
	>
		<button
			type="button"
			class="notification-popup-dismiss"
			aria-label="Dismiss notification"
			@click.stop="emit('dismiss', popup.id)"
		>
			<HugeiconsIcon :icon="Cancel01Icon" width="1em" height="1em" />
		</button>

		<div class="notification-popup-body">
			<p class="notification-popup-message">
				<strong v-if="popup.label">{{ popup.label }}:</strong>
				{{ popup.message }}
			</p>

			<RouterLink
				v-if="popup.linkTo && !isExternalLink"
				:to="popup.linkTo"
				class="notification-popup-link"
				@click="emit('dismiss', popup.id)"
			>
				{{ popup.linkLabel || 'View' }}
			</RouterLink>

			<a
				v-else-if="popup.linkTo && isExternalLink"
				:href="popup.linkTo"
				class="notification-popup-link"
				target="_blank"
				rel="noopener noreferrer"
				@click="emit('dismiss', popup.id)"
			>
				{{ popup.linkLabel || 'View' }}
			</a>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Cancel01Icon } from '@hugeicons/core-free-icons'

const props = defineProps({
	popup: {
		type: Object,
		required: true,
	},
})

const emit = defineEmits(['dismiss'])

const isExternalLink = computed(() =>
	typeof props.popup.linkTo === 'string' && /^https?:\/\//.test(props.popup.linkTo)
)
</script>

<style scoped>
.notification-popup {
	position: relative;
	width: min(22rem, calc(100vw - 2rem));
	margin: 0;
	padding: 0.75rem 2.25rem 0.75rem 0.75rem;
	cursor: default;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-popup-message {
	margin: 0;
}

.notification-popup-body {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.notification-popup-link {
	color: inherit;
	font-weight: bold;
	text-decoration: underline;
	align-self: flex-start;
}

.notification-popup-link:hover {
	opacity: 0.85;
}

.notification-popup-dismiss {
	position: absolute;
	top: 0.35rem;
	right: 0.35rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	padding: 0;
	border: 0;
	border-radius: 0.35rem;
	background: transparent;
	color: inherit;
	cursor: pointer;
	opacity: 0.75;
}

.notification-popup-dismiss:hover {
	opacity: 1;
	background: rgba(0, 0, 0, 0.08);
}
</style>
