<template>
	<Section 
		title="Table Example" 
		subtitle="A simple table with sortable columns and pagination"
		:padding = "false"
		>
		 <template #toolbar>
			 <button>Add Item</button>
		 </template>

		<Table 
			 :data = "data" 
			 :headers = "headers" 
			 :show-pagination = "true"
			 >
			 <template #cell-name="{ row, value }">
				 <router-link :to="{ name: 'ViewItem', params: { id: row.name } }">
					 {{ value }}
				 </router-link>
			 </template>

			 <template #cell-city="{ row, value }">
				 <span class = "subtle">
				 {{ value }}
				 </span>
			 </template>
		</Table>
	</Section>
</template>

<script setup>
	import { ref, onMounted } from 'vue'
	import { getExampleTableRows } from '../data/examplePeople.js'

	const headers = ref([
		{ key: "name", label: "Name", sortable: true, hidden: false, width: "20%" },
		{ key: "age", label: "Age", sortable: false },
		{ key: "city", label: "City", sortable: true, width: "200px" },
	])

	const data = ref([])

	onMounted(() => {
		data.value = getExampleTableRows()
	})
</script>
