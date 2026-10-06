<template>
	<div
		class="field-value"
		:class="{
			'is-inline': hasInlineEdit,
			'is-outline': hasOutlineEdit,
			'is-readonly': readOnly,
		}"
	>
		<div
			v-if="editing"
			ref="editRoot"
			class="field-value-edit"
			@click.stop
		>
			<slot
				name="edit"
				:value="draft"
				:update="updateDraft"
				:commit="commit"
				:cancel="cancel"
			/>
		</div>
		<div
			v-else
			class="field-value-display"
			:class="{ editable: hasInlineEdit }"
			@click="startEdit"
		>
			<span class="field-value-content">
				<slot>{{ displayText }}</slot>
			</span>
			<HugeiconsIcon
				v-if="hasInlineEdit"
				:icon="Edit03Icon"
				class="field-value-icon"
				width="0.9em"
				height="0.9em"
				aria-hidden="true"
			/>
			<router-link
				v-else-if="to"
				:to="to"
				class="field-value-icon field-value-outline"
				:title="editLabel"
				:aria-label="editLabel"
				@click.stop
			>
				<HugeiconsIcon
					:icon="FileEditIcon"
					width="0.9em"
					height="0.9em"
					aria-hidden="true"
				/>
			</router-link>
			<a
				v-else-if="href"
				:href="href"
				class="field-value-icon field-value-outline"
				:title="editLabel"
				:aria-label="editLabel"
				@click.stop
			>
				<HugeiconsIcon
					:icon="FileEditIcon"
					width="0.9em"
					height="0.9em"
					aria-hidden="true"
				/>
			</a>
			<span
				v-else
				class="field-value-icon field-value-readonly"
				title="Read only"
				aria-label="Read only"
			>
				<HugeiconsIcon
					:icon="SquareLock01Icon"
					width="0.9em"
					height="0.9em"
					aria-hidden="true"
				/>
			</span>
		</div>
	</div>
</template>

<script setup>
import { computed, nextTick, ref, useSlots } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Edit03Icon, FileEditIcon, SquareLock01Icon } from '@hugeicons/core-free-icons'

const props = defineProps({
	modelValue: {
		type: [String, Number, Boolean],
		default: '',
	},
	/**
	 * Route for outline edit. Shown when no edit template is provided.
	 */
	to: {
		type: [String, Object],
		default: null,
	},
	/**
	 * URL for outline edit when a router location is not used.
	 */
	href: {
		type: String,
		default: '',
	},
	editLabel: {
		type: String,
		default: 'Edit',
	},
})

const emit = defineEmits(['update:modelValue', 'commit', 'cancel'])

const slots = useSlots()
const editing = ref(false)
const draft = ref('')
const editRoot = ref(null)

const hasInlineEdit = computed(() => typeof slots.edit === 'function')
const hasOutlineEdit = computed(() => !hasInlineEdit.value && Boolean(props.to || props.href))
const readOnly = computed(() => !hasInlineEdit.value && !hasOutlineEdit.value)
const displayText = computed(() => (props.modelValue == null ? '' : String(props.modelValue)))

function startEdit() {
	if (!hasInlineEdit.value || editing.value) {
		return
	}
	draft.value = displayText.value
	editing.value = true
	nextTick(() => {
		const control = editRoot.value?.querySelector('input, select, textarea')
		if (!control) {
			return
		}
		control.focus()
		if (control instanceof HTMLInputElement && control.type !== 'checkbox') {
			control.select()
		}
	})
}

function updateDraft(value) {
	draft.value = value == null ? '' : String(value)
}

function commit() {
	if (!editing.value) {
		return
	}
	emit('update:modelValue', draft.value)
	emit('commit', draft.value)
	editing.value = false
}

function cancel() {
	if (!editing.value) {
		return
	}
	editing.value = false
	draft.value = displayText.value
	emit('cancel')
}
</script>

<style scoped>
.field-value-display,
.field-value-edit {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	min-height: 1.5em;
}

.field-value-display.editable {
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 3px;
}

.field-value-display.editable:hover {
	background-color: var(--hover-background-color, #f8f9fa);
}

.field-value-content {
	min-width: 0;
}

.field-value-icon {
	flex-shrink: 0;
	color: var(--muted-text-color, #8a8a8a);
	opacity: 0.55;
}

.field-value-outline,
.field-value-readonly {
	display: inline-flex;
	line-height: 0;
}

.field-value-outline {
	text-decoration: none;
}

.field-value-display.editable:hover .field-value-icon,
.field-value-outline:hover {
	opacity: 0.9;
}

.field-value-edit :deep(input),
.field-value-edit :deep(select),
.field-value-edit :deep(textarea) {
	width: 100%;
	max-width: 28rem;
	box-sizing: border-box;
}
</style>
