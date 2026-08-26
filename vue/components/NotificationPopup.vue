<template>
	<div class="notification-popup" role="status">
		<NotificationBlock
			:type="notificationType"
			:label="popup.label || ''"
		>
			<span class="notification-popup-content">
				<span class="notification-popup-message">{{ popup.message }}</span>

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
			</span>
		</NotificationBlock>

		<button
			type="button"
			class="notification-popup-dismiss"
			aria-label="Dismiss notification"
			@click.stop="emit('dismiss', popup.id)"
		>
			<HugeiconsIcon :icon="Cancel01Icon" width="1em" height="1em" />
		</button>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import NotificationBlock from './NotificationBlock.vue'

const props = defineProps({
	popup: {
		type: Object,
		required: true,
	},
})

const emit = defineEmits(['dismiss'])

const notificationType = computed(() => props.popup.class || 'info')

const isExternalLink = computed(() =>
	typeof props.popup.linkTo === 'string' && /^https?:\/\//.test(props.popup.linkTo)
)
</script>

<style scoped>
.notification-popup {
	position: relative;
	width: min(22rem, calc(100vw - 2rem));
	margin: 0;
	box-shadow: 0 4px 12px color-mix(in srgb, var(--shadow-color) 60%, transparent);
}

.notification-popup :deep(.notification) {
	margin: 0;
}

.notification-popup-content {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.notification-popup-message {
	display: block;
}

.notification-popup-link {
	color: var(--link-color);
	font-weight: bold;
	text-decoration: underline;
	align-self: flex-start;
}

.notification-popup-link:hover {
	text-decoration-thickness: 2px;
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
	color: var(--text-color);
	cursor: pointer;
	opacity: 0.75;
}

.notification-popup-dismiss:hover {
	opacity: 1;
	background: var(--hover-background-color);
}
</style>
