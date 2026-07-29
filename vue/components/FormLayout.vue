<template>
	<form>
		<slot />
		<fieldset v-if="$slots.actions">
			<slot name="actions" />
		</fieldset>
	</form>
</template>
