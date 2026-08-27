<template>
	<Section title="Login" classes="">
		<Login
			ref="loginRef"
			@local-login="handleLocalLogin"
			@oauth-login="handleOAuthLogin"
			@tab-change="onTabChange"
		/>
	</Section>
</template>

<script setup>
import { ref } from 'vue';
import Section from '../components/Section.vue';
import Login from '../components/Login.vue';

const loginRef = ref(null);

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
	//     // Handle error
	//   }
	// } catch (error) {
	//   // Handle error
	// }

	// Placeholder success
	alert(`Local login would authenticate: ${credentials.username}`);
	loginRef.value?.setLocalLoginLoading(false);
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
