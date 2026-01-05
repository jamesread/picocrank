<template>
	<Section title="Login Example" subtitle="A reusable login form component with local and OAuth2 authentication">
		<Login 
			:oauth-providers="oauthProviders"
			:custom-tabs="customTabs"
			@local-login="handleLocalLogin"
			@oauth-login="handleOAuthLogin"
			@tab-change="onTabChange"
		>
			<!-- Custom tab: Magic Link Login -->
			<template #tab-magic-link="{ tab }">
				<div class="login-section">
					<form @submit.prevent="handleMagicLinkLogin" class="magic-link-form">
						<input
							v-model="magicLinkEmail"
							type="email"
							required
							autocomplete="email"
							placeholder="Email address"
						/>
						<button type="submit" class="good">Send Magic Link</button>
						<div v-if="magicLinkError" class="error-message">
							{{ magicLinkError }}
						</div>
						<div v-if="magicLinkSuccess" class="success-message">
							{{ magicLinkSuccess }}
						</div>
					</form>
				</div>
			</template>

			<!-- Custom tab: SSO Login -->
			<template #tab-sso="{ tab }">
				<div class="login-section">
					<div class="sso-providers">
						<button
							v-for="ssoProvider in ssoProviders"
							:key="ssoProvider.id"
							class="sso-button good"
							@click="handleSSOLogin(ssoProvider)"
							:title="`Sign in with ${ssoProvider.name}`"
						>
							<span>{{ ssoProvider.name }}</span>
						</button>
					</div>
					<div v-if="ssoError" class="error-message">
						{{ ssoError }}
					</div>
				</div>
			</template>
		</Login>
	</Section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Section from '../components/Section.vue';
import Login from '../components/Login.vue';

const router = useRouter();

// Custom tabs configuration
const customTabs = ref([
	{ id: 'magic-link', label: 'Magic Link' },
	{ id: 'sso', label: 'SSO' }
]);

// Magic Link state
const magicLinkEmail = ref('');
const magicLinkError = ref('');
const magicLinkSuccess = ref('');

// SSO providers
const ssoProviders = ref([
	{ id: 'okta', name: 'Okta SSO' },
	{ id: 'auth0', name: 'Auth0 SSO' },
	{ id: 'saml', name: 'SAML SSO' }
]);
const ssoError = ref('');

// OAuth providers configuration
const oauthProviders = ref([
	{
		id: 'google',
		name: 'Google',
		icon: null, // Add icon from @hugeicons/core-free-icons if available
		class: 'good',
		authUrl: '/api/auth/google'
	},
	{
		id: 'github',
		name: 'GitHub',
		icon: null, // Add icon from @hugeicons/core-free-icons if available
		class: 'neutral',
		authUrl: '/api/auth/github'
	},
	{
		id: 'microsoft',
		name: 'Microsoft',
		icon: null, // Add icon from @hugeicons/core-free-icons if available
		class: 'good',
		authUrl: '/api/auth/microsoft'
	},
	{
		id: 'facebook',
		name: 'Facebook',
		icon: null, // Add icon from @hugeicons/core-free-icons if available
		class: 'good',
		authUrl: '/api/auth/facebook'
	},
	{
		id: 'twitter',
		name: 'Twitter',
		icon: null, // Add icon from @hugeicons/core-free-icons if available
		class: 'neutral',
		authUrl: '/api/auth/twitter'
	},
	{
		id: 'apple',
		name: 'Apple',
		icon: null, // Add icon from @hugeicons/core-free-icons if available
		class: 'neutral',
		authUrl: '/api/auth/apple'
	}
]);

// Handle local login
function handleLocalLogin(credentials) {
	console.log('Local login attempt:', {
		username: credentials.username,
		password: '***' // Don't log passwords in production
	});

	// TODO: Implement actual authentication logic
	// Example: Simulate API call
	// try {
	//   const response = await fetch('/api/auth/local', {
	//     method: 'POST',
	//     headers: { 'Content-Type': 'application/json' },
	//     body: JSON.stringify(credentials)
	//   });
	//   
	//   if (response.ok) {
	//     const data = await response.json();
	//     // Store token, redirect, etc.
	//     router.push('/');
	//   } else {
	//     // Handle error - you can use the component's setLocalLoginError method
	//   }
	// } catch (error) {
	//   // Handle error
	// }

	// Placeholder success
	alert(`Local login would authenticate: ${credentials.username}`);
}

// Handle OAuth login
function handleOAuthLogin(provider) {
	console.log('OAuth login attempt:', provider);

	// TODO: Implement actual OAuth redirect logic
	// Example: Redirect to OAuth provider
	// window.location.href = provider.authUrl;
	
	// Placeholder
	alert(`OAuth login would redirect to: ${provider.name}`);
}

// Handle tab change
function onTabChange(tab, tabId) {
	console.log('Tab changed:', tab, tabId);
	// Clear custom tab errors when switching tabs
	magicLinkError.value = '';
	magicLinkSuccess.value = '';
	ssoError.value = '';
}

// Handle magic link login
function handleMagicLinkLogin() {
	magicLinkError.value = '';
	magicLinkSuccess.value = '';
	
	if (!magicLinkEmail.value) {
		magicLinkError.value = 'Please enter your email address';
		return;
	}

	// TODO: Implement actual magic link logic
	// Example: Send magic link email
	// try {
	//   const response = await fetch('/api/auth/magic-link', {
	//     method: 'POST',
	//     headers: { 'Content-Type': 'application/json' },
	//     body: JSON.stringify({ email: magicLinkEmail.value })
	//   });
	//   
	//   if (response.ok) {
	//     magicLinkSuccess.value = 'Magic link sent! Check your email.';
	//   } else {
	//     magicLinkError.value = 'Failed to send magic link';
	//   }
	// } catch (error) {
	//   magicLinkError.value = 'An error occurred';
	// }

	// Placeholder
	magicLinkSuccess.value = `Magic link would be sent to: ${magicLinkEmail.value}`;
}

// Handle SSO login
function handleSSOLogin(provider) {
	ssoError.value = '';
	
	// TODO: Implement actual SSO redirect logic
	// Example: Redirect to SSO provider
	// window.location.href = provider.authUrl;
	
	// Placeholder
	alert(`SSO login would redirect to: ${provider.name}`);
}
</script>

<style scoped>
.magic-link-form,
.sso-providers {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
}

.magic-link-form input {
	padding: 0.75rem;
	border: 1px solid var(--border-color, #ccc);
	border-radius: 4px;
	font-size: 1em;
	background-color: var(--input-bg, #fff);
	color: var(--text-color, #000);
	width: 100%;
}

.magic-link-form input:focus {
	outline: none;
	border-color: var(--primary-color, #007bff);
	box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.magic-link-form button,
.sso-button {
	width: 100%;
	padding: 0.75rem 1.5rem;
	font-size: 1em;
	cursor: pointer;
	border: none;
	border-radius: 4px;
	transition: opacity 0.2s;
}

.magic-link-form button:hover,
.sso-button:hover {
	opacity: 0.9;
}

.success-message {
	padding: 0.75rem;
	background-color: var(--success-bg, #efe);
	color: var(--success-color, #3c3);
	border-radius: 4px;
	font-size: 0.9em;
	margin-top: 0.5rem;
	width: 100%;
}
</style>
