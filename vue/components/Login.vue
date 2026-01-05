<template>
	<div class="login-container">
		<Tabs :tabs="loginTabs" @tab-change="onTabChange">
			<!-- Local Login Tab -->
			<template #tab-local>
				<div class="login-section">
					<form @submit.prevent="handleLocalLogin" class="local-login-form">
						<input
							id="username"
							v-model="localLogin.username"
							required
							autocomplete="username"
							placeholder="Username"
						/>
						<input
							id="password"
							type="password"
							v-model="localLogin.password"
							required
							autocomplete="current-password"
							placeholder="Password"
						/>
						<button type="submit" class="good">Login</button>
						<div v-if="localLoginError" class="error-message">
							{{ localLoginError }}
						</div>
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
	
	// Add default tabs if enabled
	if (props.showDefaultTabs) {
		tabs.push(
			{ id: 'local', label: props.tabLabels.local || 'Username & Password' },
			{ id: 'oauth', label: props.tabLabels.oauth || 'OAuth2' }
		);
	}
	
	// Add custom tabs
	if (props.customTabs && props.customTabs.length > 0) {
		tabs.push(...props.customTabs);
	}
	
	loginTabs.value = tabs;
}

// Initialize tabs on mount
initializeTabs();

// Watch for changes to customTabs or showDefaultTabs
watch(() => [props.customTabs, props.showDefaultTabs], () => {
	initializeTabs();
}, { deep: true });

// Local login state
const localLogin = reactive({
	username: '',
	password: ''
});

const localLoginError = ref('');

// OAuth providers - provided by parent component
const oauthProviders = ref(props.oauthProviders);
const oauthError = ref('');


// Watch for changes to oauthProviders prop
watch(() => props.oauthProviders, (newProviders) => {
	oauthProviders.value = newProviders;
}, { deep: true });

// Handle local login
function handleLocalLogin() {
	localLoginError.value = '';
	
	// Emit event for parent component to handle
	emit('local-login', {
		username: localLogin.username,
		password: localLogin.password
	});
}

// Reset local login form
function resetLocalForm() {
	localLogin.username = '';
	localLogin.password = '';
	localLoginError.value = '';
}

// Handle OAuth login
function handleOAuthLogin(provider) {
	oauthError.value = '';
	
	// Emit event for parent component to handle
	emit('oauth-login', provider);
}

// Handle tab change
function onTabChange(tab, tabId) {
	// Clear errors when switching tabs
	localLoginError.value = '';
	oauthError.value = '';
	emit('tab-change', tab, tabId);
}

// Method to set error messages
function setLocalLoginError(message) {
	localLoginError.value = message;
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
	setOAuthError,
	localLogin
});
</script>

<style scoped>
.login-container {
	max-width: 500px;
	margin: 2rem auto;
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

.local-login-form input {
	padding: 0.75rem;
	border: 1px solid var(--border-color, #ccc);
	border-radius: 4px;
	font-size: 1em;
	background-color: var(--input-bg, #fff);
	color: var(--text-color, #000);
	width: 100%;
}

.local-login-form input:focus {
	outline: none;
	border-color: var(--primary-color, #007bff);
	box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
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
	background-color: var(--error-bg, #fee);
	color: var(--error-color, #c33);
	border-radius: 4px;
	font-size: 0.9em;
	margin-top: 0.5rem;
	width: 100%;
}

.no-providers {
	padding: 2rem;
	text-align: center;
	color: var(--text-muted, #666);
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
