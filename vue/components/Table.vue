<template>
	<table class = "row-hover">
		<thead>
			<th v-for="(header, index) in visibleHeaders" :key="index" @click="toggleSort(header)" :class="{ sortable: header.sortable }">
				{{ header.label }}

				<span v-if="header.sortable && sortBy === header.key">
					<span v-if="sortDir === 'asc'">▲</span>
					<span v-else>▼</span>
				</span>
			</th>
		</thead>
		<tbody>
			<tr v-if="pagedItems.length === 0">
				<td :colspan="visibleHeaders.length">No items found</td>
			</tr>
			<tr v-else v-for="(item, index) in pagedItems" :key="index">
				<td v-for="(header, index) in visibleHeaders" :key="index" :class="{ hidden: header.hidden }">
					<span v-if = "header.linkFunc">
						<router-link :to="header.linkFunc(item)" class = "link">
							{{ item[header.key] }}
						</router-link>
					</span>
					<span v-else>
						{{ item[header.key] }}
					</span>
				</td>
			</tr>
		</tbody>
	</table>
	<div class = "padding">
		<Pagination :total = "total" v-model:page="page" v-model:page-size="pageSize" />
	</div>
</template>

<script setup>
	import { ref, computed, onMounted, watch } from 'vue';
	import Pagination from './Pagination.vue';

    const sortBy = ref(null);
	const sortDir = ref('asc');
    const page = ref(1);
	const pageSize = ref(10);

	const items = ref([])

    const sortedItems = computed(() => {
		if (!sortBy.value) return [...items.value];

		const col = sortBy.value;
		
		return [...items.value].sort((a, b) => {
		    const av = a[col];
			const bv = b[col];
			console.log("sort values", col, av, bv)

            if (av === bv) return 0;
			if (av === null || av === undefined) return 1;
			if (bv === null || bv === undefined) return -1;
			if (typeof av === 'string' && typeof bv === 'string') {
				return sortDir.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
			}
			if (typeof av === 'number' && typeof bv === 'number') {
				return sortDir.value === 'asc' ? av - bv : bv - av;
			}
			if (typeof av === 'boolean' && typeof bv === 'boolean') {
				return sortDir.value === 'asc' ? (av ? 1 : 0) - (bv ? 1 : 0) : (bv ? 1 : 0) - (av ? 1 : 0);
			}
			if (av < bv) return sortDir.value === 'asc' ? -1 : 1;
		});
	});

	watch([sortedItems, pageSize], () => { page.value = 1 });

	const pagedItems = computed(() => {
		const start = (page.value - 1) * pageSize.value;
		const ret = sortedItems.value.slice(start, start + pageSize.value);

		return ret
	});

    const total = computed(() => sortedItems.value.length);
	const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

    const visibleHeaders = computed(() => {
		return props.headers.map(header => ({
			...header,
			hidden: header.hidden === true,
		}));
	});

	const props = defineProps({
	    headers: {
			type: Array,
			default: () => ['id'],
		},
		data: {
			type: Array,
			default: () => [],
		},
	});

	function toggleSort(header) {
		if (sortBy.value === header.key) {
		    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
		} else {
		    sortBy.value = header.key;
		    sortDir.value = 'asc';
		}

		console.log(`Sorting by ${sortBy.value} in ${sortDir.value} order`);
	}

	onMounted(() => {
	    items.value = props.data;
	})
</script>

<style scoped>
table thead th:hover {
	cursor: pointer;
	color: #0366d6;
}

td:first-child, th:first-child {
	padding-left: 1rem;
}

</style>
