<template>
	<Section title="Login Example" subtitle="A reusable login form component with local and OAuth2 authentication">
		<Login 
			:oauth-providers="oauthProviders"
			@local-login="handleLocalLogin"
			@oauth-login="handleOAuthLogin"
			@tab-change="onTabChange"
		/>
	</Section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Section from '../components/Section.vue';
import Login from '../components/Login.vue';

const router = useRouter();

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
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
