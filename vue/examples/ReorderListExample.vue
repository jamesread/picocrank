<template>
	<Section
		title="Reorder list"
		:icon="DragDropVerticalIcon"
		subtitle="Drag the handle, or use the arrows, to change the order of any components shown as rows."
	>
		<p>
			<code>ReorderList</code> is a vertical list, separate from <code>Table</code>.
			Each row’s body is the <code>#item</code> slot, so the reordered content can be
			any component. The list emits <code>update:modelValue</code> with a new array.
			While dragging, a line marks the gap where the row will be inserted (native HTML5 drag-and-drop).
			<code>showMoveButtons</code>, <code>showDragHandles</code>, and <code>dragWholeRow</code>
			control how rows are reordered.
		</p>
	</Section>

	<Section title="Checklist" subtitle="Status cards in a row list">
		<template #toolbar>
			<label class="reorder-example-toggle">
				<input v-model="showMoveButtons" type="checkbox" />
				Move buttons
			</label>
			<label class="reorder-example-toggle">
				<input v-model="showDragHandles" type="checkbox" />
				Drag handles
			</label>
			<label class="reorder-example-toggle">
				<input v-model="dragWholeRow" type="checkbox" />
				Whole row drag
			</label>
			<button type="button" class="neutral" @click="resetTasks">
				Reset order
			</button>
		</template>

		<ReorderList
			v-model="tasks"
			item-key="id"
			aria-label="Checklist order"
			:show-move-buttons="showMoveButtons"
			:show-drag-handles="showDragHandles"
			:drag-whole-row="dragWholeRow"
		>
			<template #item="{ item }">
				<div class="task-row">
					<div class="task-copy">
						<strong>{{ item.title }}</strong>
						<p class="subtle">{{ item.detail }}</p>
					</div>
					<span class="tag">{{ item.tag }}</span>
				</div>
			</template>
		</ReorderList>
	</Section>

	<Section title="Current order" subtitle="Bound array after each move">
		<ol class="order-readout">
			<li v-for="task in tasks" :key="task.id">{{ task.title }}</li>
		</ol>
	</Section>

	<Section
		title="Nested lists"
		subtitle="Reorder phases, then reorder steps inside each phase — each list is its own ReorderList."
	>
		<template #toolbar>
			<button type="button" class="neutral" @click="resetPhases">
				Reset nested demo
			</button>
		</template>

		<ReorderList
			v-model="phases"
			item-key="id"
			aria-label="Release phases"
			:show-drag-handles="true"
		>
			<template #item="{ item }">
				<div class="nested-phase">
					<p class="nested-phase-title">{{ item.title }}</p>
					<ReorderList
						v-model="item.steps"
						item-key="id"
						class="nested-phase-steps"
						:aria-label="`${item.title} steps`"
						drag-whole-row
					>
						<template #item="{ item: step }">
							<span class="nested-step-label">{{ step.label }}</span>
						</template>
					</ReorderList>
				</div>
			</template>
		</ReorderList>
	</Section>

	<Section title="Nested order" subtitle="Phases and their step arrays after moves">
		<ul class="nested-readout">
			<li v-for="phase in phases" :key="phase.id">
				<strong>{{ phase.title }}</strong>
				<ol>
					<li v-for="step in phase.steps" :key="step.id">{{ step.label }}</li>
				</ol>
			</li>
		</ul>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import { DragDropVerticalIcon } from '@hugeicons/core-free-icons'
import Section from '../components/Section.vue'
import ReorderList from '../components/ReorderList.vue'

const initialTasks = [
	{ id: 'deploy', title: 'Deploy service', detail: 'Production rollout window', tag: 'Ops' },
	{ id: 'review', title: 'Review access', detail: 'Quarterly IAM check', tag: 'Security' },
	{ id: 'backup', title: 'Verify backups', detail: 'Nightly snapshot', tag: 'Ops' },
	{ id: 'notes', title: 'Publish notes', detail: 'Changelog for 2.4', tag: 'Docs' },
]

const tasks = ref(initialTasks.map((task) => ({ ...task })))
const showMoveButtons = ref(false)
const showDragHandles = ref(true)
const dragWholeRow = ref(false)

function resetTasks() {
	tasks.value = initialTasks.map((task) => ({ ...task }))
}

const initialPhases = [
	{
		id: 'build',
		title: 'Build',
		steps: [
			{ id: 'build-lint', label: 'Run linters' },
			{ id: 'build-test', label: 'Unit tests' },
			{ id: 'build-image', label: 'Container image' },
		],
	},
	{
		id: 'staging',
		title: 'Staging',
		steps: [
			{ id: 'staging-deploy', label: 'Deploy to staging' },
			{ id: 'staging-smoke', label: 'Smoke tests' },
		],
	},
	{
		id: 'production',
		title: 'Production',
		steps: [
			{ id: 'prod-approve', label: 'Change approval' },
			{ id: 'prod-deploy', label: 'Rolling deploy' },
			{ id: 'prod-verify', label: 'Post-deploy checks' },
		],
	},
]

const phases = ref(clonePhases(initialPhases))

function clonePhases(source) {
	return source.map((phase) => ({
		...phase,
		steps: phase.steps.map((step) => ({ ...step })),
	}))
}

function resetPhases() {
	phases.value = clonePhases(initialPhases)
}
</script>

<style scoped>
.task-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-width: 0;
}

.task-copy {
	flex: 1 1 auto;
	min-width: 0;
}

.task-copy p {
	margin: 0.15rem 0 0;
}

.order-readout {
	margin: 0;
	padding-left: 1.25rem;
}

.reorder-example-toggle {
	display: inline-flex;
	align-items: center;
	gap: 0.4em;
	margin-right: 0.75em;
	cursor: pointer;
	user-select: none;
}

.nested-phase {
	flex: 1 1 auto;
	min-width: 0;
}

.nested-phase-title {
	margin: 0 0 0.5rem;
	font-weight: bold;
}

.nested-phase-steps {
	margin-top: 0.25rem;
}

.nested-phase-steps :deep(.reorder-list-row) {
	padding: 0.4rem 0.55rem;
}

.nested-step-label {
	display: block;
}

.nested-readout {
	margin: 0;
	padding-left: 1.25rem;
}

.nested-readout ol {
	margin: 0.35rem 0 0.75rem;
	padding-left: 1.25rem;
}
</style>
