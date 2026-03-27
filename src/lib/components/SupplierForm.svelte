<script>
	let { onsubmit, oncancel, editSupplier } = $props();

	let isEdit = $derived(!!editSupplier);

	let name = $state(editSupplier?.name ?? '');
	let address = $state(editSupplier?.address ?? '');
	let phones = $state(editSupplier?.phones?.length ? [...editSupplier.phones] : ['']);
	let notes = $state(editSupplier?.notes ?? '');

	function addPhone() {
		phones = [...phones, ''];
	}

	function handleSubmit() {
		if (!name.trim()) return;

		onsubmit({
			name: name.trim(),
			address: address.trim(),
			phones: phones.filter(p => p.trim()),
			notes: notes.trim()
		});
	}
</script>

<div class="form-overlay">
	<div class="form-card">
		<h2>{isEdit ? 'Edit supplier' : 'New supplier'}</h2>

		<div class="form-group">
			<label>Supplier name</label>
			<input type="text" bind:value={name} />
		</div>

		<div class="form-group">
			<label>Address</label>
			<input type="text" bind:value={address} />
		</div>

		<div class="form-group">
			<label>Phone</label>
			{#each phones as phone, idx}
				<input type="tel" bind:value={phones[idx]} class="phone-input" />
			{/each}
			<button type="button" class="btn-add-link" onclick={addPhone}>+ Phone</button>
		</div>

		<div class="form-group">
			<label>Notes</label>
			<textarea bind:value={notes}></textarea>
		</div>

		<div class="form-actions">
			<button class="btn-cancel" onclick={oncancel}>Cancel</button>
			<button class="btn-save" onclick={handleSubmit}>Save</button>
		</div>
	</div>
</div>

<style>
	.form-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 16px;
	}

	.form-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		max-width: 420px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.form-card h2 {
		margin: 0 0 16px 0;
		font-size: 20px;
		color: var(--dazzle);
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-group label {
		display: block;
		font-size: var(--font-helper);
		font-weight: 600;
		color: var(--text-helper);
		margin-bottom: 6px;
	}

	.form-group input[type='text'],
	.form-group input[type='tel'],
	.form-group textarea {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		color: var(--text-body);
		background: white;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.phone-input {
		margin-bottom: 6px;
	}

	.btn-add-link {
		background: none;
		border: none;
		color: var(--dazzle);
		font-size: var(--font-helper);
		font-weight: 600;
		cursor: pointer;
		padding: 4px 0;
	}

	.form-actions {
		display: flex;
		gap: 10px;
		margin-top: 20px;
	}

	.btn-save,
	.btn-cancel {
		flex: 1;
		padding: 12px;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		font-size: 14px;
	}

	.btn-save {
		background: var(--dazzle);
		color: white;
	}

	.btn-cancel {
		background: #f0f0f0;
		color: #333;
	}
</style>
