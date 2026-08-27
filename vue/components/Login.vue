<template>
	<div class="login-container" :class="{ 'local-only': localOnly }">
		<Tabs :tabs="loginTabs" @tab-change="onTabChange">
			<!-- Local Login Tab -->
			<template #tab-local>
				<div class="login-section">
					<div
						v-if="localLoginLoading"
						class="local-login-loading"
						role="status"
						aria-live="polite"
					>
						<span class="local-login-spinner" aria-hidden="true" />
						<p>{{ localLoginLoadingMessage }}</p>
					</div>
					<form v-else @submit.prevent="handleLocalLogin" class="local-login-form">
						<FormField label="Username" for="username" label-skip v-model:error="usernameError">
							<input
								id="username"
								type="text"
								v-model="localLogin.username"
								required
								autocomplete="username"
								placeholder="Username"
								aria-label="Username"
							/>
						</FormField>
						<FormField label="Password" for="password" label-skip v-model:error="passwordError">
							<input
								id="password"
								type="password"
								v-model="localLogin.password"
								required
								autocomplete="current-password"
								placeholder="Password"
								aria-label="Password"
							/>
						</FormField>
						<button type="submit" class="good">Login</button>
						<NotificationBlock
							v-if="formError"
							class="login-form-error"
							type="bad"
							label="Error"
							:message="formError"
							role="alert"
						/>
					</form>
				</div>
			</template>

			<!-- OAuth 2 Login Tab -->
			<template #tab-oauth>
				<div class="login-section">
					<div v-if="oauthProviders.length > 0" class="oauth-providers">
						<button
							v-for="provider in oauthProviders"
							:key="provider.id"
							class="oauth-button"
							:class="provider.class || 'neutral'"
							@click="handleOAuthLogin(provider)"
							:title="`Sign in with ${provider.name}`"
						>
							<HugeiconsIcon
								v-if="provider.icon"
								:icon="provider.icon"
								width="1.2em"
								height="1.2em"
							/>
							<span>{{ provider.name }}</span>
						</button>
					</div>
					<div v-else class="no-providers">
						<p>No OAuth providers configured.</p>
					</div>
					<div v-if="oauthError" class="error-message">
						{{ oauthError }}
					</div>
				</div>
			</template>

			<!-- Forward custom tab slots -->
			<template v-for="slotName in customTabSlotNames" :key="slotName" v-slot:[slotName]="slotProps">
				<slot :name="slotName" v-bind="slotProps" />
			</template>
		</Tabs>
	</div>
</template>

<script setup>
import { ref, reactive, watch, computed, useSlots } from 'vue';
import Tabs from './Tabs.vue';
import FormField from './FormField.vue';
import NotificationBlock from './NotificationBlock.vue';
import { HugeiconsIcon } from '@hugeicons/vue';

const props = defineProps({
	// Custom OAuth providers (optional)
	oauthProviders: {
		type: Array,
		default: () => []
	},
	// Custom tab labels (optional)
	tabLabels: {
		type: Object,
		default: () => ({
			local: 'Username & Password',
			oauth: 'OAuth2'
		})
	},
	// Custom tabs to inject (optional)
	customTabs: {
		type: Array,
		default: () => []
	},
	// Whether to show default tabs (local and oauth)
	showDefaultTabs: {
		type: Boolean,
		default: true
	},
	// Username & password only — no OAuth or custom tabs; hides the tab bar
	localOnly: {
		type: Boolean,
		default: false
	},
	loadingMessage: {
		type: String,
		default: 'Signing in…'
	}
});

const emit = defineEmits(['local-login', 'oauth-login', 'tab-change']);

const slots = useSlots();

// Get custom tab slot names (exclude default tabs: tab-local and tab-oauth)
const customTabSlotNames = computed(() => {
	if (!slots) return [];
	const defaultSlots = ['tab-local', 'tab-oauth'];
	const allSlotNames = Object.keys(slots);
	return allSlotNames.filter(
		slotName => slotName.startsWith('tab-') && !defaultSlots.includes(slotName)
	);
});

// Login tabs configuration
const loginTabs = ref([]);

// Initialize tabs
function initializeTabs() {
	const tabs = [];
	
	if (props.localOnly) {
		tabs.push({ id: 'local', label: props.tabLabels.local || 'Username & Password' });
	} else if (props.showDefaultTabs) {
		tabs.push(
			{ id: 'local', label: props.tabLabels.local || 'Username & Password' },
			{ id: 'oauth', label: props.tabLabels.oauth || 'OAuth2' }
		);
	}
	
	// Add custom tabs
	if (!props.localOnly && props.customTabs && props.customTabs.length > 0) {
		tabs.push(...props.customTabs);
	}
	
	loginTabs.value = tabs;
}

// Initialize tabs on mount
initializeTabs();

// Watch for changes to customTabs or showDefaultTabs
watch(() => [props.customTabs, props.showDefaultTabs, props.localOnly], () => {
	initializeTabs();
}, { deep: true });

// Local login state
const localLogin = reactive({
	username: '',
	password: ''
});

const usernameError = ref('');
const passwordError = ref('');
const formError = ref('');
const localLoginLoading = ref(false);
const localLoginLoadingMessage = ref('');

function clearLocalLoginErrors() {
	usernameError.value = '';
	passwordError.value = '';
	formError.value = '';
}

watch(
	() => [localLogin.username, localLogin.password],
	() => {
		if (formError.value) {
			formError.value = '';
		}
	},
);

// OAuth providers - provided by parent component
const oauthProviders = ref(props.oauthProviders);
const oauthError = ref('');


// Watch for changes to oauthProviders prop
watch(() => props.oauthProviders, (newProviders) => {
	oauthProviders.value = newProviders;
}, { deep: true });

// Handle local login
function handleLocalLogin() {
	clearLocalLoginErrors();
	localLoginLoading.value = true;
	localLoginLoadingMessage.value = props.loadingMessage;

	emit('local-login', {
		username: localLogin.username,
		password: localLogin.password
	});
}

// Reset local login form
function resetLocalForm() {
	localLogin.username = '';
	localLogin.password = '';
	clearLocalLoginErrors();
	localLoginLoading.value = false;
}

// Handle OAuth login
function handleOAuthLogin(provider) {
	oauthError.value = '';
	
	// Emit event for parent component to handle
	emit('oauth-login', provider);
}

// Handle tab change
function onTabChange(tab, tabId) {
	clearLocalLoginErrors();
	oauthError.value = '';
	localLoginLoading.value = false;
	emit('tab-change', tab, tabId);
}

function setLocalLoginErrors(errors = {}) {
	localLoginLoading.value = false;
	usernameError.value = errors.username || '';
	passwordError.value = errors.password || '';
	formError.value = errors.form || '';
}

function setLocalLoginError(message) {
	setLocalLoginErrors({ form: message });
}

function setLocalLoginLoading(loading, message) {
	localLoginLoading.value = loading;
	if (loading) {
		localLoginLoadingMessage.value = message ?? props.loadingMessage;
	}
}

function setOAuthError(message) {
	oauthError.value = message;
}

// Method to add custom OAuth providers programmatically
function addOAuthProvider(provider) {
	oauthProviders.value.push(provider);
}

// Expose methods for parent components
defineExpose({
	addOAuthProvider,
	resetLocalForm,
	setLocalLoginError,
	setLocalLoginErrors,
	setLocalLoginLoading,
	setOAuthError,
	localLogin
});
</script>

<style scoped>
.login-container {
	max-width: 500px;
	margin: 2rem auto;
}

.login-container.local-only {
	margin-top: 0;
	margin-bottom: 0;
}

.login-container.local-only :deep(.tabs-header) {
	display: none;
}

.login-section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: center;
}

.local-login-form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
}

.local-login-form :deep(.form-field-control) {
	width: 100%;
}

.local-login-form :deep(input) {
	width: 100%;
	box-sizing: border-box;
}

.local-login-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	width: 100%;
	min-height: 9rem;
	padding: 1rem 0;
	color: var(--login-muted-fg);
	text-align: center;
}

.local-login-loading p {
	margin: 0;
	font-size: 0.95em;
}

.local-login-spinner {
	width: 2rem;
	height: 2rem;
	border: 3px solid var(--login-spinner-track);
	border-top-color: var(--login-spinner-fg);
	border-radius: 50%;
	animation: local-login-spin 0.75s linear infinite;
}

@keyframes local-login-spin {
	to {
		transform: rotate(360deg);
	}
}

.local-login-form button {
	width: 100%;
	padding: 0.75rem 1.5rem;
	font-size: 1em;
	cursor: pointer;
	border: none;
	border-radius: 4px;
	transition: opacity 0.2s;
}

.local-login-form button:hover {
	opacity: 0.9;
}

.local-login-form :deep(.login-form-error) {
	width: 100%;
	font-size: 0.9em;
}

.oauth-providers {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
}

.oauth-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	padding: 0.75rem 1.5rem;
	font-size: 1em;
	cursor: pointer;
	border: none;
	border-radius: 4px;
	transition: opacity 0.2s, transform 0.1s;
	width: 100%;
}

.oauth-button:hover {
	opacity: 0.9;
	transform: translateY(-1px);
}

.oauth-button:active {
	transform: translateY(0);
}

.oauth-button span {
	font-weight: 500;
}

.error-message {
	padding: 0.75rem;
	background-color: var(--login-error-bg);
	color: var(--login-error-fg);
	border-radius: 4px;
	font-size: 0.9em;
	margin-top: 0.5rem;
	width: 100%;
}

.no-providers {
	padding: 2rem;
	text-align: center;
	color: var(--login-muted-fg);
}

@media (min-width: 768px) {
	.login-container {
		max-width: 600px;
	}
	
	.oauth-providers {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}
}
</style>
