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
			 >
		</Table>
	</Section>
</template>

<script setup>
	import { ref, onMounted } from 'vue'

	const headers = ref([
		{ key: "name", label: "Name", sortable: true, hidden: true, linkFunc: getLink },
		{ key: "age", label: "Age", sortable: false, hidden: false, linkFunc: null },
		{ key: "city", label: "City", sortable: true, hidden: false, link: null },
	])


	function getLink(row) {
		return {	
			name: "ViewItem",
			params: { id: row.name.toLowerCase() }
		}
	}

	const data = ref([])

	onMounted(() => {
		data.value = [
			{ name: "Alice", age: 30, city: "New York" },
			{ name: "Bob", age: 25, city: "Los Angeles" },
			{ name: "Charlie", age: 35, city: "Chicago" },
			{ name: "David", age: 28, city: "Houston" },
			{ name: "Eve", age: 22, city: "Phoenix" },
			{ name: "Frank", age: 40, city: "Philadelphia" },
			{ name: "Grace", age: 29, city: "San Antonio" },
			{ name: "Hannah", age: 32, city: "San Diego" },
			{ name: "Ian", age: 27, city: "Dallas" },
			{ name: "Jack", age: 31, city: "San Jose" },
			{ name: "Kathy", age: 26, city: "Austin" },
			{ name: "Leo", age: 33, city: "Jacksonville" },
			{ name: "Mia", age: 24, city: "Fort Worth" },
			{ name: "Nina", age: 38, city: "Columbus" },
			{ name: "Oscar", age: 36, city: "Charlotte" },
			{ name: "Paul", age: 34, city: "San Francisco" },
			{ name: "Quinn", age: 23, city: "Indianapolis" },
			{ name: "Rita", age: 37, city: "Seattle" },
			{ name: "Sam", age: 39, city: "Denver" },
			{ name: "Tina", age: 21, city: "Washington D.C." }
		]
	})
</script>
