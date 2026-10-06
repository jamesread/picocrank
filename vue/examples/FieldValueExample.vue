<template>
	<Section
		title="Field value"
		:icon="Edit03Icon"
		subtitle="A displayed value with read-only, inline edit, or outline edit."
	>
		<p>
			Pass an <code>#edit</code> template to edit in place. Without that template, set
			<code>to</code> or <code>href</code> so the icon opens another page. Otherwise the
			value is read-only. Use the <code>#title</code> slot on <code>Section</code> for an
			editable heading.
		</p>
	</Section>

	<Section subtitle="FieldValue in the Section title slot — click the heading to rename">
		<template #title>
			<FieldValue v-model="sectionTitle">
				<template #edit="{ value, update, commit, cancel }">
					<input
						:value="value"
						type="text"
						class="field-value-title-input"
						@input="update($event.target.value)"
						@keyup.enter="commit"
						@keyup.escape="cancel"
						@blur="commit"
					/>
				</template>
			</FieldValue>
		</template>
		<p>
			The value above is the section heading. It uses the same inline edit pattern as
			definition-list fields below.
		</p>
	</Section>

	<Section title="Read only" subtitle="No edit template and no outline target">
		<dl class="field-value-dl">
			<dt>Created</dt>
			<dd>
				<FieldValue model-value="2 hours ago" />
			</dd>
		</dl>
	</Section>

	<Section title="Inline edit" subtitle="An edit template replaces the value until commit or cancel">
		<dl class="field-value-dl">
			<dt>Name</dt>
			<dd>
				<FieldValue v-model="name" @commit="lastCommit = $event">
					<template #edit="{ value, update, commit, cancel }">
						<input
							:value="value"
							type="text"
							@input="update($event.target.value)"
							@keyup.enter="commit"
							@keyup.escape="cancel"
							@blur="commit"
						/>
					</template>
				</FieldValue>
			</dd>

			<dt>Active</dt>
			<dd>
				<FieldValue v-model="active">
					<template #default>{{ active === '1' ? 'Yes' : 'No' }}</template>
					<template #edit="{ value, update, commit }">
						<input
							type="checkbox"
							:checked="value === '1'"
							@change="event => {
								update(event.target.checked ? '1' : '0')
								commit()
							}"
						/>
					</template>
				</FieldValue>
			</dd>
		</dl>
		<p v-if="lastCommit" class="subtle">Last saved name: {{ lastCommit }}</p>
	</Section>

	<Section title="Outline edit" subtitle="The icon navigates; the value itself stays read-only">
		<dl class="field-value-dl">
			<dt>Website</dt>
			<dd>
				<FieldValue
					model-value="example.com"
					to="/form-example"
					edit-label="Edit on the form page"
				/>
			</dd>

			<dt>Docs</dt>
			<dd>
				<FieldValue
					model-value="femtocrank"
					href="https://github.com/jamesread/femtocrank"
					edit-label="Open documentation"
				/>
			</dd>
		</dl>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import { Edit03Icon } from '@hugeicons/core-free-icons'
import Section from '../components/Section.vue'
import FieldValue from '../components/FieldValue.vue'

const sectionTitle = ref('Project settings')
const name = ref('Ada Lovelace')
const active = ref('1')
const lastCommit = ref('')
</script>

<style scoped>
.field-value-dl {
	grid-template-columns: 12rem minmax(0, 1fr);
}

.field-value-dl dt {
	grid-column: 1;
	box-sizing: border-box;
	min-width: 0;
}

.field-value-dl dd {
	grid-column: 2;
	box-sizing: border-box;
	min-width: 0;
}

.field-value-title-input {
	font: inherit;
	font-weight: inherit;
	color: inherit;
	min-width: 12rem;
	max-width: 100%;
}
</style>
