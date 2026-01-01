<template>
	<Section title="User Control Panel" subtitle="Manage your account settings and preferences">
		<Navigation ref="localNavigation">
			<NavigationGrid />
		</Navigation>
	</Section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Section from '../components/Section.vue';
import NavigationGrid from '../components/NavigationGrid.vue';
import Navigation from '../components/Navigation.vue';
import { 
	ViewIcon, 
	EditIcon, 
	SecurityValidationIcon, 
	HomeIcon 
} from '@hugeicons/core-free-icons';

const localNavigation = ref(null);

onMounted(() => {
	if (localNavigation.value) {
		// Add user control panel links to local navigation
		localNavigation.value.addCallback('Profile', () => {
			alert('Navigate to Profile');
		}, { 
			icon: ViewIcon, 
			name: 'user-profile',
			description: 'View and edit your profile information'
		});
		
		localNavigation.value.addCallback('Account Settings', () => {
			alert('Navigate to Account Settings');
		}, { 
			icon: EditIcon, 
			name: 'account-settings',
			description: 'Manage your account configuration'
		});
		
		localNavigation.value.addCallback('Security', () => {
			alert('Navigate to Security Settings');
		}, { 
			icon: SecurityValidationIcon, 
			name: 'security-settings',
			description: 'Change password and security options'
		});
		
		localNavigation.value.addCallback('Preferences', () => {
			alert('Navigate to Preferences');
		}, { 
			icon: HomeIcon, 
			name: 'preferences',
			description: 'Customize your application preferences'
		});
		
		localNavigation.value.addCallback('Notifications', () => {
			alert('Navigate to Notifications');
		}, { 
			icon: ViewIcon, 
			name: 'notifications',
			description: 'Manage notification settings'
		});
		
		localNavigation.value.addCallback('Billing', () => {
			alert('Navigate to Billing');
		}, { 
			icon: EditIcon, 
			name: 'billing',
			description: 'View billing and subscription details'
		});
	}
});
</script>

<style scoped>
/* Additional styles if needed */
</style>
